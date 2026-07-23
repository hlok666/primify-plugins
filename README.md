# Primify Plugins

Primify loads this public catalog from a primary source and a Gitee backup. Every plugin package is accepted only after its declared file size and SHA-256 digest are verified.

Official public plugin registry for Primify desktop.

Primify reads `registry.json`, verifies the package size and SHA-256 digest, then validates the plugin manifest before installation. Plugin packages are published as GitHub release assets.

## Available plugins

- Sequence Homology Search: multi-reference local BLAST search with gene, transcript, coordinate, alignment, visualization, and report output.
- Core Hunter Core Collection: local CV/HE/SH core germplasm optimization with rate scanning, constraints, and Excel reports.
- FASTA Merge: batch FASTA/archive import, sequence renaming, preview, and merged export.
- Chromatogram Viewer: ABI/AB1 trace, base call, quality, trimming, and FASTA export.
- Multiple Alignment: bundled ClustalW 2.1 alignment with configurable pyMSAviz rendering.
- SuperDecode Adapter: installs the official Windows release from the upstream source on demand, verifies its fixed size and SHA-256 digest, and can also connect to an existing installation. Primify does not redistribute the upstream binary.

## Security

Plugins execute locally and may access data granted by Primify. Only install plugins from publishers you trust. Official packages in this repository are built from the matching source directory and listed with a SHA-256 digest.

## Development

See [`docs/plugin-development.md`](https://github.com/hlok666/primify/blob/main/docs/plugin-development.md) in the Primify repository for the plugin manifest and runner protocol.
