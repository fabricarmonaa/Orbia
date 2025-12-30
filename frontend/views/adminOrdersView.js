import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const AdminOrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.fetchAdminOrders(session.token);
      setOrders(response.orders || []);
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
      <Text>Pedidos</Text>
      {error ? <Text>{error}</Text> : null}
      {orders.map(o => (
        <Text key={o.id}>{`${o.id} - estado ${o.status} - total ${o.total}`}</Text>
      ))}
      {!orders.length && !error ? <Text>No hay pedidos</Text> : null}
      <Button title="Refrescar" onPress={load} />
    </View>
  );
};
