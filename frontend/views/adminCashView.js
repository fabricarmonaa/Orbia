import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const AdminCashView = () => {
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.fetchAdminCash(session.token);
      setMovements(response.cash || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View>
      <Text>Caja</Text>
      {error ? <Text>{error}</Text> : null}
      {movements.map(m => (
        <Text key={m.id}>{`${m.category} - ${m.method} - ${m.amount}`}</Text>
      ))}
      {!movements.length && !error ? <Text>No hay movimientos</Text> : null}
      <Button title="Refrescar" onPress={load} />
    </View>
  );
};
