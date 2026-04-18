package vision

import (
	"context"
	"fmt"
	"net"

	"golang.org/x/net/ipv4"
)

// listenMulticastUDP binds a reusable UDP socket on the multicast port and joins
// the group explicitly. This allows multiple local listeners on platforms such
// as macOS where SO_REUSEPORT is required for multicast fan-out.
func listenMulticastUDP(addr, ifaceName string) (*net.UDPConn, func() error, error) {
	udpAddr, err := net.ResolveUDPAddr("udp4", addr)
	if err != nil {
		return nil, nil, err
	}
	if udpAddr.IP == nil || !udpAddr.IP.IsMulticast() {
		return nil, nil, fmt.Errorf("%s is not an IPv4 multicast address", addr)
	}

	lc := net.ListenConfig{Control: reusePortControl}
	packetConn, err := lc.ListenPacket(context.Background(), "udp4", fmt.Sprintf(":%d", udpAddr.Port))
	if err != nil {
		return nil, nil, err
	}

	udpConn, ok := packetConn.(*net.UDPConn)
	if !ok {
		_ = packetConn.Close()
		return nil, nil, fmt.Errorf("unexpected packet connection type %T", packetConn)
	}

	joinIfaces, explicitIface, err := multicastInterfaces(ifaceName)
	if err != nil {
		_ = packetConn.Close()
		return nil, nil, err
	}

	group := &net.UDPAddr{IP: udpAddr.IP}
	ipv4Conn := ipv4.NewPacketConn(packetConn)
	joinedIfaces := make([]*net.Interface, 0, len(joinIfaces))
	var lastJoinErr error

	for _, ifi := range joinIfaces {
		if err := ipv4Conn.JoinGroup(ifi, group); err != nil {
			if explicitIface {
				_ = packetConn.Close()
				return nil, nil, fmt.Errorf("join multicast group %s on interface %s: %w", udpAddr.IP, ifaceName, err)
			}
			lastJoinErr = err
			continue
		}
		joinedIfaces = append(joinedIfaces, ifi)
	}

	if len(joinedIfaces) == 0 {
		_ = packetConn.Close()
		if lastJoinErr != nil {
			return nil, nil, fmt.Errorf("join multicast group %s on any interface: %w", udpAddr.IP, lastJoinErr)
		}
		return nil, nil, fmt.Errorf("no multicast-capable interfaces available for %s", udpAddr.IP)
	}

	cleanup := func() error {
		var cleanupErr error
		for _, ifi := range joinedIfaces {
			if err := ipv4Conn.LeaveGroup(ifi, group); err != nil && cleanupErr == nil {
				cleanupErr = err
			}
		}
		if err := packetConn.Close(); err != nil && cleanupErr == nil {
			cleanupErr = err
		}
		return cleanupErr
	}

	return udpConn, cleanup, nil
}

func multicastInterfaces(ifaceName string) ([]*net.Interface, bool, error) {
	if ifaceName != "" {
		ifi, err := net.InterfaceByName(ifaceName)
		if err != nil {
			return nil, true, err
		}
		return []*net.Interface{ifi}, true, nil
	}

	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, false, err
	}

	selected := make([]*net.Interface, 0, len(ifaces))
	for i := range ifaces {
		flags := ifaces[i].Flags
		if flags&net.FlagUp == 0 || flags&net.FlagMulticast == 0 {
			continue
		}
		ifi := ifaces[i]
		selected = append(selected, &ifi)
	}

	return selected, false, nil
}
