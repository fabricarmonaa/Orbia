import React, { useState, useRef } from 'react';

export function VoiceAssistant({ api }) {
    const [isRecording, setIsRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pendingCommand, setPendingCommand] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await sendAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Mic Error:', err);
            alert('No se pudo acceder al micrófono');
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }

    async function sendAudio(blob) {
        setProcessing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64Audio = reader.result.split(',')[1];
                try {
                    const res = await api.request('/admin/ai/command', {
                        method: 'POST',
                        body: JSON.stringify({ audio_base64: base64Audio })
                    });
                    setPendingCommand(res);
                } catch (err) {
                    alert('Error IA: ' + err.message);
                } finally {
                    setProcessing(false);
                }
            };
        } catch (err) {
            setProcessing(false);
        }
    }

    async function handleConfirm() {
        if (!pendingCommand) return;
        try {
            await api.request(`/admin/ai/command/${pendingCommand.ai_command_id}/confirm`, { method: 'POST' });
            alert('✅ Comando ejecutado');
            setPendingCommand(null);
            // Optionally trigger a global refresh? For now, user manually refreshes pages.
        } catch (err) {
            alert('Error confirmando: ' + err.message);
        }
    }

    async function handleReject() {
        if (!pendingCommand) return;
        try {
            await api.request(`/admin/ai/command/${pendingCommand.ai_command_id}/reject`, { method: 'POST' });
            setPendingCommand(null);
        } catch (err) {
            setPendingCommand(null);
        }
    }

    return (
        <>
            {/* Floating Mic Button */}
            <button
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: isRecording ? 'var(--danger)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: '24px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={processing}
            >
                {processing ? '...' : (isRecording ? '⏹' : '🎙️')}
            </button>

            {/* Modal for Pending Command */}
            {pendingCommand && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
                        <h2>🤖 Confirmar Acción</h2>
                        <p style={{ fontStyle: 'italic' }}>"{pendingCommand.payload?.original_text || '...'}"</p>

                        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', margin: '15px 0' }}>
                            <p><strong>Resumen:</strong> {pendingCommand.summary}</p>
                            <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>{JSON.stringify(pendingCommand.payload, null, 2)}</pre>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="secondary" onClick={handleReject}>Cancelar</button>
                            <button onClick={handleConfirm}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
