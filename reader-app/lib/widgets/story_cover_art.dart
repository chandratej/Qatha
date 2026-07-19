import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Generated typographic story cover — port of creator-cms
/// `StoryCoverArt.tsx`. Deterministic: same hash + palettes as the web
/// version, so a story shows the identical cover in Creator Studio,
/// the reader app, and the gateway.
class StoryCoverArt extends StatelessWidget {
  final String title;

  /// Stable identity (story id preferred; falls back to title).
  final String? seed;

  const StoryCoverArt({super.key, required this.title, this.seed});

  static const List<_CoverPalette> _palettes = [
    _CoverPalette('maroon', Color(0xFF4A1526), Color(0xFF6B2338),
        Color(0xFFF5E9D8), Color(0x66C4A052)),
    _CoverPalette('indigo', Color(0xFF232059), Color(0xFF3D3A8C),
        Color(0xFFECE8F8), Color(0x57E8D5A3)),
    _CoverPalette('turmeric', Color(0xFF7A4A16), Color(0xFFC47A2A),
        Color(0xFFFDF4E4), Color(0x52FFF0D2)),
    _CoverPalette('sage', Color(0xFF2E4234), Color(0xFF4A6350),
        Color(0xFFE8F0E8), Color(0x57C4A052)),
    _CoverPalette('ember', Color(0xFF58203C), Color(0xFF8B3A62),
        Color(0xFFF8E8EF), Color(0x52E8D5A3)),
    _CoverPalette('brass', Color(0xFF2A241C), Color(0xFF4A3F2E),
        Color(0xFFEAD9B8), Color(0x73C4A052)),
  ];

  /// Mirrors the web hash: `hash = (hash * 31 + charCodeAt(i)) | 0`.
  static _CoverPalette _paletteFor(String seed) {
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.codeUnitAt(i)).toSigned(32);
    }
    return _palettes[hash.abs() % _palettes.length];
  }

  double _titleSize(String title) {
    final len = title.runes.length;
    if (len <= 10) return 15;
    if (len <= 22) return 13;
    if (len <= 40) return 11.5;
    return 10.5;
  }

  @override
  Widget build(BuildContext context) {
    final palette = _paletteFor(seed ?? title);
    return Container(
      key: ValueKey('cover-palette-${palette.id}'),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [palette.from, palette.to],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _PalmMotifPainter(palette.motif)),
          Positioned.fill(
            child: Container(
              margin: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                border: Border.all(color: palette.motif, width: 1),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 12, 10, 22),
            child: Center(
              child: Text(
                title,
                textAlign: TextAlign.center,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.notoSerifTelugu(
                  fontSize: _titleSize(title),
                  fontWeight: FontWeight.w600,
                  height: 1.5,
                  color: palette.ink,
                  shadows: const [
                    Shadow(
                        color: Color(0x40000000),
                        blurRadius: 3,
                        offset: Offset(0, 1)),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 9,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(width: 14, height: 1, color: palette.motif),
                const SizedBox(width: 6),
                Text(
                  'కథ',
                  style: GoogleFonts.notoSerifTelugu(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: palette.motif,
                  ),
                ),
                const SizedBox(width: 6),
                Container(width: 14, height: 1, color: palette.motif),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoverPalette {
  final String id;
  final Color from;
  final Color to;
  final Color ink;
  final Color motif;
  const _CoverPalette(this.id, this.from, this.to, this.ink, this.motif);
}

/// Palm-leaf manuscript wave motif — repeating quadratic arcs, matching
/// the web SVG pattern (56×28 tile).
class _PalmMotifPainter extends CustomPainter {
  final Color color;
  _PalmMotifPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: color.a * 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    const tileW = 56.0;
    const tileH = 28.0;
    for (var y = 0.0; y < size.height + tileH; y += tileH) {
      final path = Path();
      for (var x = -tileW; x < size.width + tileW; x += tileW) {
        path.moveTo(x, y + 23);
        path.quadraticBezierTo(x + 14, y + 5, x + 28, y + 23);
        path.quadraticBezierTo(x + 42, y + 7, x + 56, y + 23);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_PalmMotifPainter oldDelegate) =>
      oldDelegate.color != color;
}
