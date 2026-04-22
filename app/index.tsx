import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada!');
        return;
      }

      // Pega a posição GPS atual do usuário
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
    })();
  }, []);

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      setPhotoUri(photoData.uri);
      setIsCameraOpen(false); // Fecha a câmera e volta pro mapa
    }
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) return;
    }
    setIsCameraOpen(true);
  };

  if (isCameraOpen) {
    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
              <Text style={styles.buttonText}>Capturar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsCameraOpen(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01, // Controla o zoom inicial
            longitudeDelta: 0.01,
          }}
        >
          {/* Se o usuário tirou uma foto, mostra o marcador no mapa */}
          {photoUri && (
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
              {/* Customizando o marcador com a foto em miniatura */}
              <View style={styles.markerContainer}>
                <Image source={{ uri: photoUri }} style={styles.markerImage} />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <Text style={styles.loadingText}>Buscando localização...</Text>
      )}

      {/* Botão flutuante para abrir a câmera */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
          <Text style={styles.buttonText}>Adicionar Foto Aqui</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingText: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: '#fff' },

  // Mapa
  map: { flex: 1 },
  footer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  actionButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 30, elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Marcador do Mapa Customizado
  markerContainer: { padding: 2, backgroundColor: '#fff', borderRadius: 10, elevation: 5 },
  markerImage: { width: 100, height: 100, borderRadius: 8 },

  // Câmera
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-evenly' },
  captureButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 30 },
  cancelButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 30 },
});
