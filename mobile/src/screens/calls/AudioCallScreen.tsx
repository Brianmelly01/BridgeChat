import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { callService } from '../../services/apiServices';
import { socketService } from '../../services/socket';
import { formatDuration } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');
type RouteT = RouteProp<RootStackParamList, 'AudioCall'>;

export default function AudioCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { callId, remoteUserId, remoteUserName, avatarUrl, isCaller } = route.params;
  const [status, setStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>(isCaller ? 'calling' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    socketService.on('call:accepted', () => {
      setStatus('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });
    socketService.on('call:ended', () => { setStatus('ended'); clearInterval(timerRef.current); setTimeout(() => navigation.goBack(), 1500); });
    socketService.on('call:rejected', () => { setStatus('ended'); Alert.alert('Call Declined'); setTimeout(() => navigation.goBack(), 1000); });

    return () => {
      socketService.off('call:accepted');
      socketService.off('call:ended');
      socketService.off('call:rejected');
      clearInterval(timerRef.current);
    };
  }, []);

  const handleEnd = async () => {
    if (callId) await callService.endCall(callId).catch(() => {});
    socketService.emit('call:end', { callId, participantIds: [remoteUserId] });
    navigation.goBack();
  };

  const handleAccept = async () => {
    if (callId) await callService.acceptCall(callId).catch(() => {});
    socketService.emit('call:accept', { callId, callerId: remoteUserId });
    setStatus('connected');
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#0F3460']} style={styles.container}>
      {/* Status */}
      <View style={styles.callInfo}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{remoteUserName?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.callerName}>{remoteUserName}</Text>
        <Text style={styles.callStatus}>
          {status === 'calling' ? 'Calling...' : status === 'ringing' ? 'Incoming call' : status === 'connected' ? formatDuration(duration) : 'Call ended'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'connected' && (
          <View style={styles.midControls}>
            <TouchableOpacity style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]} onPress={() => setIsMuted(v => !v)}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={26} color="#fff" />
              <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, isSpeaker && styles.ctrlBtnActive]} onPress={() => setIsSpeaker(v => !v)}>
              <Ionicons name={isSpeaker ? 'volume-high' : 'volume-medium'} size={26} color="#fff" />
              <Text style={styles.ctrlLabel}>Speaker</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mainControls}>
          {status === 'ringing' && !isCaller && (
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <LinearGradient colors={['#10B981','#059669']} style={styles.callBtnGrad}>
                <Ionicons name="call" size={32} color="#fff" />
              </LinearGradient>
              <Text style={styles.ctrlLabel}>Accept</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd}>
            <LinearGradient colors={['#EF4444','#DC2626']} style={styles.callBtnGrad}>
              <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </LinearGradient>
            <Text style={styles.ctrlLabel}>{status === 'ringing' && !isCaller ? 'Decline' : 'End'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 60 },
  callInfo: { alignItems: 'center', gap: 16 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(108,99,255,0.3)', borderWidth: 3, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 52, color: '#fff', fontWeight: '700' },
  callerName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  callStatus: { fontSize: 16, color: C.textMuted },
  controls: { gap: 40, paddingHorizontal: 40 },
  midControls: { flexDirection: 'row', justifyContent: 'space-around' },
  mainControls: { flexDirection: 'row', justifyContent: 'center', gap: 40 },
  ctrlBtn: { alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 50, width: 70, height: 70, justifyContent: 'center' },
  ctrlBtnActive: { backgroundColor: 'rgba(108,99,255,0.4)' },
  ctrlLabel: { color: C.textSecondary, fontSize: 12, marginTop: 4 },
  acceptBtn: { alignItems: 'center', gap: 8 },
  endBtn: { alignItems: 'center', gap: 8 },
  callBtnGrad: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:12, elevation:10 },
});
