/// StoryVerse Dependency Injection Configuration
/// Uses GetIt for service location with Riverpod integration

import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

final GetIt getIt = GetIt.instance;

@InjectableInit(
  initializerName: 'init',
  preferRelativeImports: true,
  asExtension: true,
)
Future<void> configureDependencies() async => getIt.init();

// Manual registrations for core services
void registerCoreServices() {
  // Add any manual registrations here
}
