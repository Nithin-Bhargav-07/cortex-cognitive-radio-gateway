
import base64, io, numpy as np
from scipy import signal as scipy_signal

def synthesise(text: str) -> dict:
    """
    Generate TTS audio with pit radio bandpass effect.
    Returns base64 encoded audio string.
    """
    try:
        from kokoro import KPipeline
        pipeline = KPipeline(lang_code='a')
        generator = pipeline(text, voice='af_bella', speed=1.1)

        audio_chunks = []
        for _, _, audio in generator:
            audio_chunks.append(audio)

        if not audio_chunks:
            return {"audio_b64": ""}

        full_audio = np.concatenate(audio_chunks)

        # Bandpass filter — simulate pit wall radio (300Hz–3400Hz)
        b, a = scipy_signal.butter(
            3, [300/12000, 3400/12000], btype='bandpass'
        )
        radio_audio = scipy_signal.lfilter(b, a, full_audio)

        # Convert to 16-bit PCM wav in memory
        import soundfile as sf
        buf = io.BytesIO()
        sf.write(buf, radio_audio, 24000, format='WAV', subtype='PCM_16')
        buf.seek(0)
        audio_b64 = base64.b64encode(buf.read()).decode('utf-8')
        return {"audio_b64": audio_b64}

    except Exception as e:
        print(f"[TTS] Error: {e}")
        return {"audio_b64": ""}
