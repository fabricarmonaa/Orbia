import base64
import tempfile
import os
from faster_whisper import WhisperModel

# Load Faster-Whisper model (using 'base' for good balance between speed and accuracy)
# Options: tiny, base, small, medium, large
MODEL = None

def get_model():
    global MODEL
    if MODEL is None:
        print("Loading Faster-Whisper model (base)...")
        # Using CPU, can be changed to "cuda" if you have GPU
        MODEL = WhisperModel("base", device="cpu", compute_type="int8")
        print("Faster-Whisper model loaded successfully")
    return MODEL

def speech_to_text(audio_base64: str | None) -> str:
    """
    Converts base64-encoded audio to text using Faster-Whisper.
    
    Args:
        audio_base64: Base64 encoded audio (WAV, MP3, OGG, WEBM, etc.)
    
    Returns:
        Transcribed text or empty string on error
    """
    if not audio_base64:
        return ""
    
    try:
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_base64)
        
        # Write to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe with Faster-Whisper
            model = get_model()
            segments, info = model.transcribe(temp_audio_path, language="es")
            
            # Combine all segments into full transcript
            transcript = " ".join([segment.text for segment in segments]).strip()
            
            print(f"[STT] Detected language: {info.language} (probability: {info.language_probability:.2f})")
            print(f"[STT] Transcription: {transcript}")
            
            return transcript
            
        finally:
            # Clean up temp file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
    
    except Exception as e:
        print(f"[STT ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return ""
