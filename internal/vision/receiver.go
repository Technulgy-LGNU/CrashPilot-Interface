package vision

import (
	"log"
	"net"

	"google.golang.org/protobuf/proto"

	pb "github.com/technulgy-lgnu/crashpilot-interface/gen/proto"
	"github.com/technulgy-lgnu/crashpilot-interface/internal/hub"
)

const maxDatagramSize = 8192

// Receiver listens for SSL Vision multicast packets and forwards them to the hub.
type Receiver struct {
	addr  string
	iface string
	hub   *hub.Hub
}

// NewReceiver creates a new vision receiver.
func NewReceiver(addr, iface string, h *hub.Hub) *Receiver {
	return &Receiver{
		addr:  addr,
		iface: iface,
		hub:   h,
	}
}

// Run starts listening for SSL Vision packets. It blocks until an unrecoverable error occurs.
func (r *Receiver) Run() error {
	udpAddr, err := net.ResolveUDPAddr("udp", r.addr)
	if err != nil {
		return err
	}

	var ifi *net.Interface
	if r.iface != "" {
		ifi, err = net.InterfaceByName(r.iface)
		if err != nil {
			return err
		}
	}

	conn, err := net.ListenMulticastUDP("udp", ifi, udpAddr)
	if err != nil {
		return err
	}
	defer conn.Close()

	if err := conn.SetReadBuffer(maxDatagramSize * 4); err != nil {
		log.Printf("vision: warning: could not set read buffer: %v", err)
	}

	log.Printf("vision: listening on %s", r.addr)

	buf := make([]byte, maxDatagramSize)
	for {
		n, _, err := conn.ReadFromUDP(buf)
		if err != nil {
			log.Printf("vision: read error: %v", err)
			continue
		}

		wrapper := &pb.SSL_WrapperPacket{}
		if err := proto.Unmarshal(buf[:n], wrapper); err != nil {
			log.Printf("vision: unmarshal error: %v", err)
			continue
		}

		r.hub.UpdateVision(wrapper)
	}
}
