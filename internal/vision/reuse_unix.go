//go:build darwin || dragonfly || freebsd || linux || netbsd || openbsd

package vision

import "syscall"

func reusePortControl(_, _ string, c syscall.RawConn) error {
	var sockErr error
	if err := c.Control(func(fd uintptr) {
		if err := syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1); err != nil {
			sockErr = err
			return
		}
		if err := syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_REUSEPORT, 1); err != nil {
			sockErr = err
		}
	}); err != nil {
		return err
	}
	return sockErr
}
