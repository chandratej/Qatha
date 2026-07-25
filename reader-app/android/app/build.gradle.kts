import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.katha.katha_reader"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.katha.katha_reader"
        // Razorpay Standard Checkout requires minSdk 21+; use 23 for modern UPI package visibility.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = maxOf(flutter.minSdkVersion, 23)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    // Release signing: prefer keystore via env / gradle.properties (P0-07).
    // Set KATHA_UPLOAD_STORE_FILE, KATHA_UPLOAD_STORE_PASSWORD, KATHA_UPLOAD_KEY_ALIAS,
    // KATHA_UPLOAD_KEY_PASSWORD — or android/key.properties — before Play upload.
    // Until configured, release falls back to debug so local `flutter run --release` works.
    val keystorePropertiesFile = rootProject.file("key.properties")
    val keystoreProperties = Properties()
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
    }
    val uploadStoreFile = System.getenv("KATHA_UPLOAD_STORE_FILE")
        ?: keystoreProperties.getProperty("storeFile")
    val uploadStorePassword = System.getenv("KATHA_UPLOAD_STORE_PASSWORD")
        ?: keystoreProperties.getProperty("storePassword")
    val uploadKeyAlias = System.getenv("KATHA_UPLOAD_KEY_ALIAS")
        ?: keystoreProperties.getProperty("keyAlias")
    val uploadKeyPassword = System.getenv("KATHA_UPLOAD_KEY_PASSWORD")
        ?: keystoreProperties.getProperty("keyPassword")
    val hasReleaseKeystore = !uploadStoreFile.isNullOrBlank()
        && !uploadStorePassword.isNullOrBlank()
        && !uploadKeyAlias.isNullOrBlank()
        && !uploadKeyPassword.isNullOrBlank()

    if (hasReleaseKeystore) {
        signingConfigs {
            create("release") {
                storeFile = file(uploadStoreFile as String)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                // Debug fallback — do NOT ship this APK to Play Store
                println("WARNING: No release keystore configured; signing release with debug keys")
                signingConfigs.getByName("debug")
            }
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

flutter {
    source = "../.."
}
