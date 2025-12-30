import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { api } from '../models/api.js';
import { session } from '../models/session.js';
import { routeByRole } from '../controllers/authController.js';

export const LoginView = ({ navigation }) => {
  const [tenantId, setTenantId] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await api.login(tenantId, dni, password);
      session.setAuth(response.access_token, response.user);
      setMessage('Login exitoso');
      routeByRole(navigation, response.user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <View>
      <Text>Login con DNI + contraseña</Text>
      <TextInput placeholder="Tenant" value={tenantId} onChangeText={setTenantId} />
      <TextInput placeholder="DNI" value={dni} onChangeText={setDni} />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Ingresar" onPress={handleLogin} />
      {message ? <Text>{message}</Text> : null}
    </View>
  );
};
