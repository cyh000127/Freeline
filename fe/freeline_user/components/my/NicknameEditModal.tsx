import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

type Props = {
  visible: boolean;
  initialNickname: string;
  onClose: () => void;
  onSave: (nickname: string) => void;
};

export default function NicknameEditModal({ visible, initialNickname, onClose, onSave }: Props) {
  const [nickname, setNickname] = useState(initialNickname);

  useEffect(() => {
    if (visible) {
      setNickname(initialNickname);
    }
  }, [visible, initialNickname]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContainer}
            >
              <Text style={styles.title}>닉네임 변경</Text>
              
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="새 닉네임 입력"
                placeholderTextColor="#A6A1AE"
                autoFocus
                maxLength={20}
              />
              
              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </Pressable>
                
                <Pressable 
                  style={[
                    styles.saveButton, 
                    nickname.trim().length === 0 && styles.saveButtonDisabled
                  ]} 
                  disabled={nickname.trim().length === 0}
                  onPress={() => {
                    onSave(nickname.trim());
                    onClose();
                  }}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E3E4E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    marginBottom: 24,
    backgroundColor: '#F7F7F8',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  saveButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#302C55',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#A6A1AE',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
