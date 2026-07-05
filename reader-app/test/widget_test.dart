import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:katha_reader/core/providers/app_state.dart';
import 'package:katha_reader/core/providers/auth_state.dart';
import 'package:katha_reader/main.dart';

void main() {
  testWidgets('Katha app loads home screen', (WidgetTester tester) async {
    final authState = AuthState();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppState()),
          ChangeNotifierProvider.value(value: authState),
        ],
        child: const KathaApp(),
      ),
    );

    expect(find.text('కథ'), findsOneWidget);
  });
}