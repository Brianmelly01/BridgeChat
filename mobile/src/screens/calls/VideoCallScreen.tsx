import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/MainNavigator';
import { darkColors as C } from '../../theme/colors';
import { callService } from '../../services/apiServices';
import { socketService } from '../../services/socket';
import { formatDuration } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');
type RouteT = RouteProp<RootStackParamList, 'VideoCall'>;

export default function VideoCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { callId, remoteUserId, remoteUserName, isCaller } = route.params;
  const [status, setStatus] = useState<'calling'|'ringing'|'connected'|'ended'>(isCaller ? 'calling' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    socketService.on('call:accepted', () => {
      setStatus('connected');
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });
    socketService.on('call:ended', () => { setStatus('ended'); clearInterval(timerRef.current); setTimeout(() => navigation.goBack(), 1500); });
    socketService.on('call:rejected', () => { setStatus('ended'); setTimeout(() => navigation.goBack(), 1000); });
    return () => {
      socketService.off('call:accepted'); socketService.off('call:ended'); socketService.off('call:rejected');
      clearInterval(timerRef.current);
    };
  }, []);

  const handleEnd = async () => {
    if (callId) await callService.endCall(callId).catch(() => {});
    socketService.emit('call:end', { callId, participantIds: [remoteUserId] });
    navigation.goBack();
  };

  const handleAccept = () => {
    if (callId) callService.acceptCall(callId).catch(() => {});
    socketService.emit('call:accept', { callId, callerId: remoteUserId });
    setStatus('connected');
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  return (
    <View style={styles.container}>
      {/* Remote video background */}
      <LinearGradient colors={['#0A0A0F', '#1A1A2E', '#0F3460']} style={styles.remoteVideo}>
        {status !== 'connected' && (
          <View style={styles.callingOverlay}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{remoteUserName?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.callerName}>{remoteUserName}</Text>
            <Text style={styles.callStatus}>
              {status === 'calling' ? '📹 Calling...' : status === 'ringing' ? '📹 Incoming video call' : 'Call ended'}
            </Text>
          </View>
        )}
        {status === 'connected' && (
          <View style={styles.connectedInfo}>
            <Text style={styles.timer}>{formatDuration(duration)}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Local video PiP */}
      <TouchableOpacity style={styles.localVideo} onPress={() => setIsFrontCamera(v => !v)}>
        <View style={styles.localVideoInner}>
          <Ionicons name="person" size={28} color={C.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBtn}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{remoteUserName}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, isMuted && styles.ctrlBtnOff]} onPress={() => setIsMuted(v => !v)}>
          <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
          <Text style={styles.ctrlLabel}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, isCameraOff && styles.ctrlBtnOff]} onPress={() => setIsCameraOff(v => !v)}>
          <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
          <Text style={styles.ctrlLabel}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={() => setIsFrontCamera(v => !v)}>
          <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          <Text style={styles.ctrlLabel}>Flip</Text>
        </TouchableOpacity>

        {status === 'ringing' && !isCaller && (
          <TouchableOpacity style={styles.acceptCallBtn} onPress={handleAccept}>
            <LinearGradient colors={['#10B981','#059669']} style={styles.callBtnGrad}>
              <Ionicons name="videocam" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.ctrlLabel}>Accept</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.endCallBtn} onPress={handleEnd}>
          <LinearGradient colors={['#EF4444','#DC2626']} style={styles.callBtnGrad}>
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </LinearGradient>
          <Text style={styles.ctrlLabel}>End</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1 },
  callingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(108,99,255,0.3)', borderWidth: 3, borderColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 52, color: '#fff', fontWeight: '700' },
  callerName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  callStatus: { fontSize: 15, color: C.textMuted },
  connectedInfo: { position: 'absolute', top: 100, alignSelf: 'center' },
  timer: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  localVideo: { position: 'absolute', top: 100, right: 16, width: 100, height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.5, shadowRadius:8, elevation:10 },
  localVideoInner: { flex: 1, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 56, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topBarBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 22 },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  controls: { position: 'absolute', bottom: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 20, paddingHorizontal: 24 },
  ctrlBtn: { alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, width: 64, height: 64, justifyContent: 'center' },
  ctrlBtnOff: { backgroundColor: 'rgba(239,68,68,0.4)' },
  ctrlLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  acceptCallBtn: { alignItems: 'center', gap: 6 },
  endCallBtn: { alignItems: 'center', gap: 6 },
  callBtnGrad: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.4, shadowRadius:8, elevation:10 },
});
