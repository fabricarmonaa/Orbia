import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const AdminPaymentsView = () => {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.fetchAdminPayments(session.token);
      setPayments(response.payments || []);
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
      <Text>Pagos</Text>
      {error ? <Text>{error}</Text> : null}
      {payments.map(p => (
        <Text key={p.id}>{`${p.amount} via ${p.method} en ${p.paid_at}`}</Text>
      ))}
      {!payments.length && !error ? <Text>No hay pagos</Text> : null}
      <Button title="Refrescar" onPress={load} />
    </View>
  );
};
