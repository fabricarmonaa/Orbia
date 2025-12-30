import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const AdminAiCommandView = () => {
  const [text, setText] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [summary, setSummary] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const send = async () => {
    try {
      const response = await api.sendAiCommand(session.token, text || 'Simulación de comando');
      setPendingId(response.ai_command_id);
      setSummary(response.summary);
      setResult('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const confirm = async () => {
    try {
      const response = await api.confirmAiCommand(session.token, pendingId);
      setResult(JSON.stringify(response));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const reject = async () => {
    try {
      const response = await api.rejectAiCommand(session.token, pendingId);
      setResult(JSON.stringify(response));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View>
      <Text>Comando por voz (simulado)</Text>
      <TextInput value={text} onChangeText={setText} placeholder="Describe el comando" />
      <Button title="Enviar" onPress={send} />
      {summary ? <Text>{summary}</Text> : null}
      {pendingId ? (
        <View>
          <Button title="Confirmar" onPress={confirm} />
          <Button title="Rechazar" onPress={reject} />
        </View>
      ) : null}
      {result ? <Text>{result}</Text> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
};
