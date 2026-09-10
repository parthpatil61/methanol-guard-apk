import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register';

export default function AuthorityLoginScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');

  const [officerId, setOfficerId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  function clearFields() {
    setOfficerId('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    clearFields();
  }

  async function handleLogin() {
    const cleanOfficerId = officerId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanOfficerId ||
      !cleanEmail ||
      !password.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Enter the Officer ID, registered email, and password.',
      );
      return;
    }

    try {
      setLoading(true);

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        console.error(
          'Authority login error:',
          authError,
        );

        if (
          authError.message
            ?.toLowerCase()
            .includes('email not confirmed')
        ) {
          Alert.alert(
            'Email not confirmed',
            'This officer account has not been confirmed yet. Confirm the email in Supabase Authentication, or disable email confirmation for this prototype.',
          );
          return;
        }

        if (
          authError.message
            ?.toLowerCase()
            .includes('invalid login credentials')
        ) {
          Alert.alert(
            'Sign in failed',
            'The email or password is incorrect. Check the registered email and password in Supabase Authentication.',
          );
          return;
        }

        Alert.alert(
          'Sign in failed',
          authError.message ||
            'Unable to sign in.',
        );

        return;
      }

      const user = authData.user;

      if (!user) {
        Alert.alert(
          'Sign in failed',
          'No authenticated user was returned.',
        );
        return;
      }

      const {
        data: authorityUser,
        error: authorityError,
      } = await supabase
        .from('authority_users')
        .select(
          'user_id, officer_id, role, active',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (authorityError) {
        console.error(
          'Authority role check error:',
          authorityError,
        );

        await supabase.auth.signOut();

        Alert.alert(
          'Access check failed',
          'Could not verify authority access. Make sure the authority_users table and its policy are configured correctly.',
        );

        return;
      }

      if (!authorityUser) {
        await supabase.auth.signOut();

        Alert.alert(
          'Access denied',
          'No authority profile is associated with this account.',
        );

        return;
      }

      const registeredOfficerId = String(
        authorityUser.officer_id ?? '',
      )
        .trim()
        .toLowerCase();

      const enteredOfficerId =
        cleanOfficerId.toLowerCase();

      if (
        registeredOfficerId !==
        enteredOfficerId
      ) {
        await supabase.auth.signOut();

        Alert.alert(
          'Access denied',
          'The Officer ID does not match this authority account.',
        );

        return;
      }

      if (authorityUser.role !== 'authority') {
        await supabase.auth.signOut();

        Alert.alert(
          'Access denied',
          'This account is not an authority account.',
        );

        return;
      }

      if (authorityUser.active !== true) {
        await supabase.auth.signOut();

        Alert.alert(
          'Account pending',
          'Your officer account has been registered but has not yet been approved by an authority administrator.',
        );

        return;
      }

      console.log(
        'Authority login successful:',
        cleanOfficerId,
      );

      router.replace('/authority-dashboard');
    } catch (error) {
      console.error(
        'Authority login error:',
        error,
      );

      Alert.alert(
        'Sign in failed',
        'Something went wrong while signing in.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    const cleanOfficerId = officerId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanOfficerId ||
      !cleanEmail ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Complete all registration fields.',
      );

      return;
    }

    if (cleanOfficerId.length < 3) {
      Alert.alert(
        'Invalid Officer ID',
        'Officer ID must contain at least 3 characters.',
      );

      return;
    }

    if (!cleanEmail.includes('@')) {
      Alert.alert(
        'Invalid email',
        'Enter a valid email address.',
      );

      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Weak password',
        'Password must contain at least 8 characters.',
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Enter the same password in both fields.',
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            officer_id: cleanOfficerId,
          },
        },
      });

      if (error) {
        console.error(
          'Authority registration error:',
          error,
        );

        if (
          error.message
            ?.toLowerCase()
            .includes('rate limit')
        ) {
          Alert.alert(
            'Registration limit reached',
            'Supabase has temporarily limited authentication requests. Please wait and try again later.',
          );

          return;
        }

        if (
          error.message
            ?.toLowerCase()
            .includes('already registered')
        ) {
          Alert.alert(
            'Account already exists',
            'An account with this email already exists. Use Sign in instead.',
          );

          return;
        }

        Alert.alert(
          'Registration failed',
          error.message ||
            'Unable to create the officer account.',
        );

        return;
      }

      if (!data.user) {
        Alert.alert(
          'Registration failed',
          'The officer account could not be created.',
        );

        return;
      }

      if (!data.session) {
        Alert.alert(
          'Registration successful',
          'Your officer account has been created. If email confirmation is enabled, confirm your email first. Authority access will remain pending until an administrator approves your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                setMode('login');
                setPassword('');
                setConfirmPassword('');
              },
            },
          ],
        );

        return;
      }

      await supabase.auth.signOut();

      Alert.alert(
        'Registration submitted',
        'Your officer account has been created and is awaiting authority approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              setMode('login');
              setPassword('');
              setConfirmPassword('');
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        'Authority registration error:',
        error,
      );

      Alert.alert(
        'Registration failed',
        'Something went wrong while creating the officer account.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>

            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.back}>
                  ← Back
                </Text>
              </Pressable>

              <Text
                style={styles.headerTitle}
              >
                Authority Access
              </Text>

              <View
                style={{ width: 50 }}
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              <View style={styles.mark} />

              <Text style={styles.title}>
                Government Authority Portal
              </Text>

              <Text style={styles.lede}>
                Authorized personnel access
                for Methanol Guard
                surveillance records.
              </Text>

              {/* Security notice */}
              <View
                style={styles.secureNotice}
              >
                <Text
                  style={styles.secureText}
                >
                  {mode === 'login'
                    ? 'SECURE AUTHENTICATION'
                    : 'OFFICER REGISTRATION'}
                </Text>

                <Text
                  style={
                    styles.secureDescription
                  }
                >
                  {mode === 'login'
                    ? 'Sign in using your registered authority account.'
                    : 'Create an officer account. Authority access requires administrator approval.'}
                </Text>
              </View>

              {/* Mode buttons */}
              <View
                style={styles.modeRow}
              >
                <Pressable
                  style={[
                    styles.modeButton,
                    mode === 'login' &&
                      styles.modeButtonActive,
                  ]}
                  onPress={() =>
                    switchMode('login')
                  }
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === 'login' &&
                        styles.modeTextActive,
                    ]}
                  >
                    Sign in
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modeButton,
                    mode === 'register' &&
                      styles.modeButtonActive,
                  ]}
                  onPress={() =>
                    switchMode('register')
                  }
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.modeText,
                      mode === 'register' &&
                        styles.modeTextActive,
                    ]}
                  >
                    Create account
                  </Text>
                </Pressable>
              </View>

              {/* Officer ID */}
              <Text style={styles.label}>
                Officer ID
              </Text>

              <TextInput
                style={styles.input}
                value={officerId}
                onChangeText={setOfficerId}
                placeholder="Enter Officer ID"
                placeholderTextColor="#8a8175"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />

              {/* Email */}
              <Text style={styles.label}>
                Email
              </Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#8a8175"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />

              {/* Password */}
              <Text style={styles.label}>
                Password
              </Text>

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={
                  mode === 'register'
                    ? 'Minimum 8 characters'
                    : 'Enter password'
                }
                placeholderTextColor="#8a8175"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType={
                  mode === 'register'
                    ? 'next'
                    : 'done'
                }
                onSubmitEditing={() => {
                  if (mode === 'login') {
                    handleLogin();
                  }
                }}
              />

              {/* Confirm password */}
              {mode === 'register' && (
                <>
                  <Text
                    style={styles.label}
                  >
                    Confirm Password
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={
                      setConfirmPassword
                    }
                    placeholder="Re-enter password"
                    placeholderTextColor="#8a8175"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={
                      handleRegister
                    }
                  />
                </>
              )}

              {/* Main action */}
              <Pressable
                style={({ pressed }) => [
                  styles.primary,
                  pressed &&
                    styles.pressed,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={
                  mode === 'login'
                    ? handleLogin
                    : handleRegister
                }
                disabled={loading}
              >
                {loading ? (
                  <View
                    style={styles.loginRow}
                  >
                    <ActivityIndicator
                      size="small"
                      color="#fffaf1"
                    />

                    <Text
                      style={[
                        styles.primaryText,
                        {
                          marginLeft: 8,
                        },
                      ]}
                    >
                      {mode === 'login'
                        ? 'Signing in...'
                        : 'Creating account...'}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.primaryText
                    }
                  >
                    {mode === 'login'
                      ? 'Sign in'
                      : 'Create officer account'}
                  </Text>
                )}
              </Pressable>

              {/* Registration information */}
              {mode === 'register' && (
                <View
                  style={
                    styles.pendingNotice
                  }
                >
                  <Text
                    style={
                      styles.pendingTitle
                    }
                  >
                    Approval required
                  </Text>

                  <Text
                    style={
                      styles.pendingText
                    }
                  >
                    Creating an account does
                    not automatically grant
                    access to surveillance
                    records. Your authority
                    profile must be approved
                    first.
                  </Text>
                </View>
              )}

              {/* Return */}
              <Pressable
                style={({ pressed }) => [
                  styles.ghost,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  router.back()
                }
                disabled={loading}
              >
                <Text
                  style={styles.ghostText}
                >
                  Return to customer app
                </Text>
              </Pressable>
            </View>

            <Text style={styles.footer}>
              Authorized personnel only
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f1e6',
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  shell: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  back: {
    color: '#6e1d52',
    fontSize: 15,
    fontWeight: '600',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#4a1236',
    fontSize: 18,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    padding: 20,
  },

  mark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#6e1d52',
    borderWidth: 4,
    borderColor: '#ead8c0',
    marginBottom: 12,
  },

  title: {
    color: '#1c1915',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '700',
    marginBottom: 8,
  },

  lede: {
    color: '#5c564c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },

  secureNotice: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    padding: 10,
    marginBottom: 14,
  },

  secureText: {
    color: '#6e1d52',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },

  secureDescription: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
  },

  modeRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d8ceba',
    marginBottom: 18,
  },

  modeButton: {
    flex: 1,
    backgroundColor: '#f7f1e6',
    paddingVertical: 10,
    alignItems: 'center',
  },

  modeButtonActive: {
    backgroundColor: '#6e1d52',
  },

  modeText: {
    color: '#1c1915',
    fontSize: 13,
    fontWeight: '600',
  },

  modeTextActive: {
    color: '#fffaf1',
  },

  label: {
    color: '#1c1915',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#f7f1e6',
    borderWidth: 1,
    borderColor: '#d8ceba',
    color: '#1c1915',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },

  primary: {
    backgroundColor: '#6e1d52',
    borderWidth: 1,
    borderColor: '#4a1236',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },

  disabledButton: {
    opacity: 0.75,
  },

  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    color: '#fffaf1',
    fontSize: 15,
    fontWeight: '600',
  },

  pendingNotice: {
    backgroundColor: '#efe4c8',
    borderWidth: 1,
    borderColor: '#d4c392',
    padding: 10,
    marginTop: 12,
  },

  pendingTitle: {
    color: '#6e1d52',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },

  pendingText: {
    color: '#5c564c',
    fontSize: 12,
    lineHeight: 17,
  },

  ghost: {
    backgroundColor: '#fffaf1',
    borderWidth: 1,
    borderColor: '#d8ceba',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  ghostText: {
    color: '#1c1915',
    fontSize: 14,
  },

  footer: {
    textAlign: 'center',
    color: '#5c564c',
    fontSize: 12,
    marginTop: 16,
  },

  pressed: {
    opacity: 0.65,
  },
});