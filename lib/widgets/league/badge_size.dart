/// Badge size enumeration for league badges
enum BadgeSize {
  small,
  medium,
  large;

  double get size {
    switch (this) {
      case BadgeSize.small:
        return 24.0;
      case BadgeSize.medium:
        return 32.0;
      case BadgeSize.large:
        return 48.0;
    }
  }

  double get fontSize {
    switch (this) {
      case BadgeSize.small:
        return 10.0;
      case BadgeSize.medium:
        return 12.0;
      case BadgeSize.large:
        return 16.0;
    }
  }
}
