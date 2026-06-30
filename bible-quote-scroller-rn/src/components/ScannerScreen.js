import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { COLORS, FONTS } from '../theme';
import { supabase } from '../services/SupabaseClient';

const USERNAME_RE = /^[a-zA-Z0-9_]{1,30}$/;

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    if (data.startsWith('biblescroller://add-friend/')) {
      const raw = data.split('biblescroller://add-friend/')[1] ?? '';
      const username = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
      if (!USERNAME_RE.test(username)) {
        Alert.alert('Invalid QR Code', 'This QR code does not contain a valid Sanctum username.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }
      
      Alert.alert(
        'Friend Found!',
        `Would you like to add @${username} as a friend?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
          { 
            text: 'Add', 
            onPress: () => addFriendToSupabase(username) 
          }
        ]
      );
    } else {
      Alert.alert('Invalid QR Code', 'This is not a Sanctum friend QR code.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  const addFriendToSupabase = async (friendUsername) => {
    setAdding(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const myUserId = sessionData?.session?.user?.id;

      if (!myUserId) {
        Alert.alert('Error', 'You must be logged in to add friends.');
        setScanned(false);
        setAdding(false);
        return;
      }

      // Lookup the friend's user ID by their username
      const { data: friendProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', friendUsername)
        .single();
      
      if (profileError || !friendProfile) {
        Alert.alert('Not Found', `User @${friendUsername} could not be found.`);
      } else if (friendProfile.id === myUserId) {
        Alert.alert('Oops', "You can't add yourself as a friend.");
      } else {
        const { error: insertError } = await supabase.from('friends').insert({
          user_id: myUserId,
          friend_id: friendProfile.id,
        });
        if (insertError) {
          Alert.alert('Error', 'Could not add friend. You may already be friends.');
        } else {
          Alert.alert('Success', `You are now friends with @${friendUsername}!`);
        }
      }
    } catch (e) {
      console.warn('Friend add error', e);
      Alert.alert('Error', 'Something went wrong while adding friend.');
    } finally {
      setAdding(false);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator color={COLORS.accentGold}/></View>;
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button title="Allow Camera" onPress={() => Camera.requestCameraPermissionsAsync()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scan a Friend's Code</Text>
      
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned || adding ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        {/* Optical alignment square */}
        <View style={styles.targetSquare} />
      </View>

      {adding && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accentGold} />
          <Text style={styles.loadingText}>Adding Friend...</Text>
        </View>
      )}

      {scanned && !adding && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} color={COLORS.accentGold} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    color: '#F0F0F0',
    marginBottom: 40
  },
  text: {
    color: '#888',
    marginBottom: 20
  },
  cameraBox: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40
  },
  targetSquare: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.accentGold,
    marginTop: 12,
    fontFamily: FONTS.sans
  }
});
