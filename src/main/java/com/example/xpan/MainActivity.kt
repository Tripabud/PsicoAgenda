
package com.example.xpan

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import java.io.ByteArrayOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@ExperimentalPermissionsApi
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            XPanApp()
        }
    }
}

@ExperimentalPermissionsApi
@Composable
fun XPanApp() {
    val permissionsState = rememberMultiplePermissionsState(
        permissions = listOf(
            Manifest.permission.CAMERA,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
    )

    LaunchedEffect(Unit) {
        permissionsState.launchMultiplePermissionRequest()
    }

    if (permissionsState.allPermissionsGranted) {
        CameraScreen()
    } else {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(text = "Camera and storage permissions are required.")
        }
    }
}

@Composable
fun CameraScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var availableLenses by remember { mutableStateOf<List<CameraSelector>>(emptyList()) }
    var selectedLens by remember { mutableStateOf(CameraSelector.DEFAULT_BACK_CAMERA) }
    var isProcessing by remember { mutableStateOf(false) }
    val cameraExecutor: ExecutorService = remember { Executors.newSingleThreadExecutor() }

    val previewView = remember { PreviewView(context) }

    LaunchedEffect(cameraProviderFuture) {
        val cameraProvider = cameraProviderFuture.get()
        val cameraInfo = cameraProvider.availableCameraInfos
        availableLenses = cameraInfo.map { CameraSelector.Builder().setCameraId(it.cameraId).build() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        ) {
            val cameraProvider = cameraProviderFuture.get()
            val preview = Preview.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_16_9) // Use a standard aspect ratio for preview
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            imageCapture = ImageCapture.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_16_9) // Use a standard aspect ratio for capture
                .build()

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    selectedLens,
                    preview,
                    imageCapture
                )
            } catch (exc: Exception) {
                // Handle exceptions
                Log.e("CameraScreen", "Use case binding failed", exc)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Bottom,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (isProcessing) {
                CircularProgressIndicator(color = Color.White)
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    isProcessing = true
                    takePhoto(context, imageCapture, cameraExecutor) {
                        isProcessing = false
                    }
                },
                enabled = !isProcessing
            ) {
                Text("Capture")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row {
                availableLenses.forEachIndexed { index, lens ->
                    Button(
                        onClick = { selectedLens = lens },
                        modifier = Modifier.padding(horizontal = 8.dp)
                    ) {
                        Text("Lens ${index + 1}")
                    }
                }
            }
        }
    }
}

fun takePhoto(
    context: Context,
    imageCapture: ImageCapture?,
    executor: ExecutorService,
    onFinished: () -> Unit
) {
    val imageCapture = imageCapture ?: return

    imageCapture.takePicture(
        executor,
        object : ImageCapture.OnImageCapturedCallback() {
            override fun onCaptureSuccess(image: ImageProxy) {
                val bitmap = image.toBitmap()
                val croppedBitmap = cropTo65x24(bitmap)
                val xpanBitmap = applyXPanPreset(croppedBitmap)
                saveImageToGallery(context, xpanBitmap)
                image.close()
                onFinished()
                (context as? MainActivity)?.runOnUiThread {
                    Toast.makeText(context, "Photo captured", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onError(exception: ImageCaptureException) {
                // Handle error
                onFinished()
            }
        }
    )
}

fun cropTo65x24(bitmap: Bitmap): Bitmap {
    val targetAspectRatio = 65.0 / 24.0
    val sourceWidth = bitmap.width
    val sourceHeight = bitmap.height
    val sourceAspectRatio = sourceWidth.toDouble() / sourceHeight.toDouble()

    val outputWidth: Int
    val outputHeight: Int
    val x: Int
    val y: Int

    if (sourceAspectRatio > targetAspectRatio) {
        outputWidth = (sourceHeight * targetAspectRatio).toInt()
        outputHeight = sourceHeight
        x = (sourceWidth - outputWidth) / 2
        y = 0
    } else {
        outputWidth = sourceWidth
        outputHeight = (sourceWidth / targetAspectRatio).toInt()
        x = 0
        y = (sourceHeight - outputHeight) / 2
    }

    return Bitmap.createBitmap(bitmap, x, y, outputWidth, outputHeight)
}

fun applyXPanPreset(bitmap: Bitmap): Bitmap {
    val newBitmap = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(newBitmap)
    val paint = Paint()
    val colorMatrix = ColorMatrix().apply {
        setSaturation(0f)
        postConcat(ColorMatrix(floatArrayOf(
            1.2f, 0f, 0f, 0f, -50f,
            0f, 1.2f, 0f, 0f, -50f,
            0f, 0f, 1.2f, 0f, -50f,
            0f, 0f, 0f, 1f, 0f
        )))
    }
    paint.colorFilter = ColorMatrixColorFilter(colorMatrix)
    canvas.drawBitmap(bitmap, 0f, 0f, paint)
    return newBitmap
}

fun saveImageToGallery(context: Context, bitmap: Bitmap) {
    val contentValues = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, "XPan_${System.currentTimeMillis()}.jpg")
        put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
        put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/XPan")
    }

    val resolver = context.contentResolver
    val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)

    uri?.let {
        resolver.openOutputStream(it)?.use { outputStream ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, outputStream)
            Toast.makeText(context, "Image saved to gallery", Toast.LENGTH_SHORT).show()
        }
    }
}
