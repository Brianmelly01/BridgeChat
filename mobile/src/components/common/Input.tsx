import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors as C } from '../../theme/colors';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  style?: any;
}

export default function Input({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default',
  autoCapitalize = 'sentences', leftIcon, rightIcon, onRightIconPress, error, multiline,
  numberOfLines, maxLength, editable = true, style,
}: InputProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputRowError : {}, !editable ? styles.inputRowDisabled : {}]}>
        {leftIcon && <Ionicons name={leftIcon as any} size={18} color={C.textMuted} style={styles.leftIcon} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textDisabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, multiline ? styles.multiline : {}]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          selectionColor={C.primary}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Ionicons name={rightIcon as any} size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginLeft: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 2, minHeight: 52 },
  inputRowError: { borderColor: C.error },
  inputRowDisabled: { opacity: 0.6 },
  leftIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.text, paddingVertical: 10 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  rightIconBtn: { padding: 4, marginLeft: 8 },
  error: { fontSize: 12, color: C.error, marginLeft: 4 },
});
