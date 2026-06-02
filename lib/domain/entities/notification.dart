import 'package:equatable/equatable.dart';

enum NotificationType {
  newChapter,
  storyPromotion,
  authorUpdate,
  readingReminder,
  subscriptionRenewal,
  rediscoveryEvent,
  specialCollection,
  comment,
  reply,
  review,
  reaction,
  achievement,
  general,
}

enum NotificationPriority {
  low,
  normal,
  high,
  urgent,
}

class Notification extends Equatable {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String message;
  final Map<String, dynamic> data;
  final String? imageUrl;
  final String? actionUrl;
  final bool isRead;
  final NotificationPriority priority;
  final DateTime createdAt;
  final DateTime? readAt;

  const Notification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    required this.data,
    this.imageUrl,
    this.actionUrl,
    required this.isRead,
    required this.priority,
    required this.createdAt,
    this.readAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        type,
        title,
        message,
        data,
        imageUrl,
        actionUrl,
        isRead,
        priority,
        createdAt,
        readAt,
      ];

  bool get isActionable => actionUrl != null && actionUrl!.isNotEmpty;
  
  bool get isHighPriority => 
      priority == NotificationPriority.high || 
      priority == NotificationPriority.urgent;
}
