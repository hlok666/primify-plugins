# Primify Plugins

Official public plugin registry for Primify desktop.

Primify reads `registry.json`, verifies the package size and SHA-256 digest, then validates the plugin manifest before installation. Plugin packages are published as GitHub release assets.

## Available plugins

- Sequence Homology Search: multi-reference local BLAST search with gene, transcript, coordinate, alignment, visualization, and report output.
- Core Hunter Core Collection: local CV/HE/SH core germplasm optimization with rate scanning, constraints, and Excel reports.

## Security

Plugins execute locally and may access data granted by Primify. Only install plugins from publishers you trust. Official packages in this repository are built from the matching source directory and listed with a SHA-256 digest.

## Development

See [`docs/plugin-development.md`](https://github.com/hlok666/primify/blob/main/docs/plugin-development.md) in the Primify repository for the plugin manifest and runner protocol.
