import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const SuperAdminTenantsView = () => {
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.fetchTenants(session.token);
        setTenants(response.tenants || []);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  return (
    <View>
      <Text>Tenants</Text>
      {error ? <Text>{error}</Text> : null}
      {tenants.map(t => (
        <Text key={t.id}>{`${t.name} (${t.status})`}</Text>
      ))}
      {!tenants.length && !error ? <Text>No hay tenants cargados</Text> : null}
      <Button title="Refrescar" onPress={() => api.fetchTenants(session.token).then(r => setTenants(r.tenants))} />
    </View>
  );
};
