package vision

import (
	"log"
	"net"

	"google.golang.org/protobuf/proto"

	pb "github.com/technulgy-lgnu/crashpilot-interface/gen/proto"
	"github.com/technulgy-lgnu/crashpilot-interface/internal/hub"
)

// TrackedReceiver listens for SSL Vision tracked multicast packets.
type TrackedReceiver struct {
	addr  string
	iface string
	hub   *hub.Hub
}

// NewTrackedReceiver creates a new tracked receiver.
func NewTrackedReceiver(addr, iface string, h *hub.Hub) *TrackedReceiver {
	return &TrackedReceiver{
		addr:  addr,
		iface: iface,
		hub:   h,
	}
}

// Run starts listening for tracked packets. It blocks until an unrecoverable error occurs.
func (r *TrackedReceiver) Run() error {
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
		log.Printf("tracked: warning: could not set read buffer: %v", err)
	}

	log.Printf("tracked: listening on %s", r.addr)

	buf := make([]byte, maxDatagramSize)
	for {
		n, _, err := conn.ReadFromUDP(buf)
		if err != nil {
			log.Printf("tracked: read error: %v", err)
			continue
		}

		wrapper := &pb.TrackerWrapperPacket{}
		if err := proto.Unmarshal(buf[:n], wrapper); err != nil {
			log.Printf("tracked: unmarshal error: %v", err)
			continue
		}

		r.hub.UpdateTracked(wrapper)
	}
}
