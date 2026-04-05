package crashpilotinterface

import "embed"

// FrontendDist embeds the built frontend files.
// This must be at the module root so the relative path frontend/dist is correct.
//
//go:embed frontend/dist
var FrontendDist embed.FS
