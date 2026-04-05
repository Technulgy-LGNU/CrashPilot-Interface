package config

import (
	"fmt"
	"os"

	"github.com/BurntSushi/toml"
)

type Config struct {
	Server        ServerConfig        `toml:"server"`
	Vision        VisionConfig        `toml:"vision"`
	CommandTarget CommandTargetConfig `toml:"command_target"`
}

type ServerConfig struct {
	Host string `toml:"host"`
	Port int    `toml:"port"`
}

type VisionConfig struct {
	MulticastAddr  string `toml:"multicast_addr"`
	MulticastIface string `toml:"multicast_iface"`
	TrackedAddr    string `toml:"tracked_addr"`
	DefaultSource  string `toml:"default_source"`
}

type CommandTargetConfig struct {
	Host     string `toml:"host"`
	Port     int    `toml:"port"`
	Protocol string `toml:"protocol"`
}

// Load attempts to load config.toml from the given paths in order.
// It returns the first successfully parsed config.
func Load(paths ...string) (*Config, error) {
	for _, p := range paths {
		if _, err := os.Stat(p); err != nil {
			continue
		}
		cfg := &Config{}
		if _, err := toml.DecodeFile(p, cfg); err != nil {
			return nil, fmt.Errorf("failed to parse config %s: %w", p, err)
		}
		return cfg, nil
	}
	return nil, fmt.Errorf("no config file found in paths: %v", paths)
}

// Addr returns the server listen address.
func (s *ServerConfig) Addr() string {
	return fmt.Sprintf("%s:%d", s.Host, s.Port)
}

// CommandTargetAddr returns the command target address, or empty if not configured.
func (c *CommandTargetConfig) Addr() string {
	if c.Host == "" || c.Port == 0 {
		return ""
	}
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}
