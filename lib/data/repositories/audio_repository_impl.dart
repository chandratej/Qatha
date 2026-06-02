/// Audio Repository Implementation
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:storyverse/domain/entities/audio_track.dart';
import 'package:storyverse/domain/repositories/audio_repository.dart';
import 'package:storyverse/core/constants/app_constants.dart';

class AudioRepositoryImpl implements AudioRepository {
  final FirebaseFirestore _firestore;

  AudioRepositoryImpl({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Future<AudioTrackEntity?> getAudioForChapter(String chapterId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .where('chapterId', isEqualTo: chapterId)
          .limit(1)
          .get();

      if (doc.docs.isEmpty) {
        return null;
      }

      return AudioTrackEntity.fromFirestore(doc.docs.first);
    } catch (e) {
      throw Exception('Failed to get audio track: $e');
    }
  }

  @override
  Future<List<AudioTrackEntity>> getAudioForStory(String storyId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .where('storyId', isEqualTo: storyId)
          .orderBy('chapterOrder')
          .get();

      return snapshot.docs
          .map((doc) => AudioTrackEntity.fromFirestore(doc))
          .toList();
    } catch (e) {
      throw Exception('Failed to get audio tracks: $e');
    }
  }

  @override
  Future<void> createAudioTrack(AudioTrackEntity track) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .add(track.toMap());
    } catch (e) {
      throw Exception('Failed to create audio track: $e');
    }
  }

  @override
  Future<void> updateAudioTrack(AudioTrackEntity track) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .doc(track.id)
          .update(track.toMap());
    } catch (e) {
      throw Exception('Failed to update audio track: $e');
    }
  }

  @override
  Future<void> deleteAudioTrack(String trackId) async {
    try {
      await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .doc(trackId)
          .delete();
    } catch (e) {
      throw Exception('Failed to delete audio track: $e');
    }
  }

  @override
  Future<bool> isAudioAvailable(String storyId) async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.firestoreAudioTracks)
          .where('storyId', isEqualTo: storyId)
          .limit(1)
          .get();

      return snapshot.docs.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> getAudioAnalytics(String storyId) async {
    try {
      final tracks = await getAudioForStory(storyId);
      
      int totalPlays = 0;
      double avgCompletionRate = 0.0;
      
      for (final track in tracks) {
        totalPlays += track.playCount;
        avgCompletionRate += track.completionRate;
      }
      
      if (tracks.isNotEmpty) {
        avgCompletionRate /= tracks.length;
      }

      return {
        'totalPlays': totalPlays,
        'averageCompletionRate': avgCompletionRate,
        'trackCount': tracks.length,
      };
    } catch (e) {
      throw Exception('Failed to get audio analytics: $e');
    }
  }
}
