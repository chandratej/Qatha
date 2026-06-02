/// Reading theme enumeration for different reading modes
enum ReadingTheme {
  light,
  dark,
  sepia;

  String get displayName {
    switch (this) {
      case ReadingTheme.light:
        return 'Light';
      case ReadingTheme.dark:
        return 'Dark';
      case ReadingTheme.sepia:
        return 'Sepia';
    }
  }
}
