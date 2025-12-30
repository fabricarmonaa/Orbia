import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';

export const AdminUsersView = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.fetchAdminUsers(session.token);
      setUsers(response.users || []);
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
      <Text>Usuarios del tenant</Text>
      {error ? <Text>{error}</Text> : null}
      {users.map(u => (
        <Text key={u.id}>{`${u.name} (${u.dni})`}</Text>
      ))}
      {!users.length && !error ? <Text>No hay usuarios cargados</Text> : null}
      <Button title="Refrescar" onPress={load} />
    </View>
  );
};
