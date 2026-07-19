import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:katha_reader/core/providers/app_state.dart';
import 'package:katha_reader/core/providers/auth_state.dart';
import 'package:katha_reader/main.dart';

void main() {
  testWidgets('Katha app shows brand splash while hydrating', (WidgetTester tester) async {
    final authState = AuthState();
    final appState = AppState();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: appState),
          ChangeNotifierProvider.value(value: authState),
        ],
        child: const KathaApp(),
      ),
    );

    // First frame: splash with brand mark (before AppState.hydrate completes).
    await tester.pump();
    expect(find.text('కథ'), findsOneWidget);

    // Dispose the tree so flutter_animate timers are cancelled cleanly.
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump(const Duration(seconds: 2));
  });
}
