import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  SafeAreaView, 
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from './supabaseClient';

export default function App() {
  const [userRole, setUserRole] = useState(null); // 'tenant' or 'owner'
  const [searchCity, setSearchCity] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form inputs for Rent Owners
  const [ownerName, setOwnerName] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [vacantRooms, setVacantRooms] = useState('');
  const [rent, setRent] = useState('');
  const [water, setWater] = useState('');
  const [electricity, setElectricity] = useState('');

  // Fetch all live properties from Supabase
  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error.message);
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Save new property directly to Supabase
  const handleRegisterProperty = async () => {
    if (!ownerName || !city || !rent) {
      Alert.alert('Missing Info', 'Please enter your name, city, and rent amount.');
      return;
    }

    const newId = `PROP-${Math.floor(10000 + Math.random() * 90000)}`;
    const vacantCount = parseInt(vacantRooms || '0', 10);
    const isVacant = vacantCount > 0;

    const newProperty = {
      id: newId,
      owner_name: ownerName,
      city: city.trim(),
      locality: locality.trim(),
      total_rooms: parseInt(totalRooms || '1', 10),
      vacant_rooms: vacantCount,
      rent_per_room: `₹${rent}/month`,
      water_supply: water || 'Standard Supply',
      electricity: electricity || 'Sub-meter',
      status: isVacant ? 'vacant' : 'occupied'
    };

    setLoading(true);
    const { error } = await supabase.from('properties').insert([newProperty]);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success!', `Property registered with ID: ${newId}`);
      // Clear form
      setOwnerName('');
      setLocality('');
      setCity('');
      setTotalRooms('');
      setVacantRooms('');
      setRent('');
      setWater('');
      setElectricity('');
      // Refresh list & switch to tenant view
      await fetchProperties();
      setUserRole('tenant');
    }
  };

  // 1. Role Selection Screen
  if (!userRole) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeBox}>
          <Text style={styles.appTitle}>GreenDoor 🏠</Text>
          <Text style={styles.appSubtitle}>Smart Map-Based Rental Discovery</Text>

          <Text style={styles.promptText}>Please select your role to continue:</Text>

          <TouchableOpacity 
            style={[styles.roleButton, { backgroundColor: '#2D6A4F' }]} 
            onPress={() => setUserRole('tenant')}
          >
            <Text style={styles.roleButtonText}>🔍 I am a Tenant</Text>
            <Text style={styles.roleButtonSub}>Search rooms on the interactive map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleButton, { backgroundColor: '#1B4332' }]} 
            onPress={() => setUserRole('owner')}
          >
            <Text style={styles.roleButtonText}>🔑 I am a Rent Owner</Text>
            <Text style={styles.roleButtonSub}>Register and manage rental rooms</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Rent Owner Registration Screen
  if (userRole === 'owner') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.formContainer}>
          <TouchableOpacity onPress={() => setUserRole(null)}>
            <Text style={styles.backLink}>← Back to Role Selection</Text>
          </TouchableOpacity>
          <Text style={styles.screenHeading}>Register Your Property</Text>
          <Text style={styles.screenSub}>Save details to Supabase Cloud & generate map pin</Text>

          <Text style={styles.label}>Owner Full Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Rajesh Sharma" value={ownerName} onChangeText={setOwnerName} />

          <Text style={styles.label}>City</Text>
          <TextInput style={styles.input} placeholder="e.g. Agartala" value={city} onChangeText={setCity} />

          <Text style={styles.label}>Locality / Area</Text>
          <TextInput style={styles.input} placeholder="e.g. Banamalipur" value={locality} onChangeText={setLocality} />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Total Rooms</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="4" value={totalRooms} onChangeText={setTotalRooms} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Vacant Rooms</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="2" value={vacantRooms} onChangeText={setVacantRooms} />
            </View>
          </View>

          <Text style={styles.label}>Rent Per Room (₹/month)</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="6500" value={rent} onChangeText={setRent} />

          <Text style={styles.label}>Water Supply Facility</Text>
          <TextInput style={styles.input} placeholder="e.g. 24/7 Submersible" value={water} onChangeText={setWater} />

          <Text style={styles.label}>Electricity Meter Details</Text>
          <TextInput style={styles.input} placeholder="e.g. Separate Sub-meter" value={electricity} onChangeText={setElectricity} />

          <TouchableOpacity style={styles.submitButton} onPress={handleRegisterProperty} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Generate Pin & Save to Cloud</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. Tenant Map & Discovery Screen
  const filteredProperties = properties.filter(p => 
    (p.city && p.city.toLowerCase().includes(searchCity.toLowerCase())) || 
    (p.locality && p.locality.toLowerCase().includes(searchCity.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setUserRole(null)}>
          <Text style={styles.backLink}>← Switch Role</Text>
        </TouchableOpacity>
        <Text style={styles.mapTitle}>GreenDoor Map</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search by city or locality..." 
          value={searchCity} 
          onChangeText={setSearchCity} 
        />
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.mapNotice}>📍 Live Real-Time Property Feed</Text>
        <View style={styles.legendRow}>
          <Text style={styles.legendItem}>🟢 Green Pin = Vacant</Text>
          <Text style={styles.legendItem}>🔴 Red Pin = Occupied</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.pinsList}>
            {filteredProperties.length === 0 ? (
              <Text style={styles.emptyText}>No properties found. Switch to Owner role to register one!</Text>
            ) : (
              filteredProperties.map((prop) => (
                <TouchableOpacity 
                  key={prop.id} 
                  style={[styles.pinCard, prop.status === 'vacant' ? styles.pinCardGreen : styles.pinCardRed]}
                  onPress={() => setSelectedProperty(prop)}
                >
                  <View style={styles.pinHeader}>
                    <Text style={styles.pinIcon}>{prop.status === 'vacant' ? '🟢 🏠' : '🔴 🏠'}</Text>
                    <View>
                      <Text style={styles.pinOwner}>{prop.owner_name}'s Property</Text>
                      <Text style={styles.pinLoc}>{prop.locality}, {prop.city} • ID: {prop.id}</Text>
                    </View>
                  </View>
                  <Text style={styles.pinStatusText}>
                    {prop.status === 'vacant' ? `Available: ${prop.vacant_rooms} Room(s)` : 'Currently Full'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Property Details Modal */}
      {selectedProperty && (
        <Modal animationType="slide" transparent={true} visible={!!selectedProperty}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedProperty.owner_name}'s Property</Text>
              <Text style={styles.modalId}>UID: {selectedProperty.id}</Text>

              <View style={styles.modalDetails}>
                <Text style={styles.detailItem}>📍 Location: {selectedProperty.locality}, {selectedProperty.city}</Text>
                <Text style={styles.detailItem}>💰 Rent: {selectedProperty.rent_per_room}</Text>
                <Text style={styles.detailItem}>🚪 Available: {selectedProperty.vacant_rooms} of {selectedProperty.total_rooms} rooms</Text>
                <Text style={styles.detailItem}>💧 Water: {selectedProperty.water_supply}</Text>
                <Text style={styles.detailItem}>⚡ Electricity: {selectedProperty.electricity}</Text>
              </View>

              <TouchableOpacity 
                style={styles.contactButton} 
                onPress={() => Alert.alert('Contacting Owner', `Connecting you to ${selectedProperty.owner_name} to schedule a visit!`)}
              >
                <Text style={styles.contactButtonText}>📞 Contact Owner & Schedule Visit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProperty(null)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  welcomeBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#1B4332', marginBottom: 6 },
  appSubtitle: { fontSize: 16, color: '#555', marginBottom: 40 },
  promptText: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#333' },
  roleButton: { width: '100%', padding: 20, borderRadius: 14, marginBottom: 16, elevation: 3 },
  roleButtonText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  roleButtonSub: { color: '#D8F3DC', fontSize: 13, textAlign: 'center', marginTop: 4 },
  formContainer: { padding: 20 },
  screenHeading: { fontSize: 24, fontWeight: 'bold', color: '#1B4332', marginTop: 10 },
  screenSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  backLink: { color: '#2D6A4F', fontWeight: 'bold', fontSize: 15, marginVertical: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row' },
  submitButton: { backgroundColor: '#2D6A4F', padding: 16, borderRadius: 10, marginTop: 24, marginBottom: 40 },
  submitButtonText: { color: '#FFF', textAlign: 'center', fontSize: 17, fontWeight: 'bold' },
  header: { paddingHorizontal: 16, paddingTop: 10 },
  mapTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B4332' },
  searchBox: { padding: 16 },
  searchInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CCC', borderRadius: 10, padding: 12, fontSize: 15 },
  mapContainer: { flex: 1, marginHorizontal: 16, backgroundColor: '#E9ECEF', borderRadius: 16, padding: 16, marginBottom: 16 },
  mapNotice: { fontSize: 16, fontWeight: 'bold', color: '#495057', textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  legendItem: { fontSize: 12, fontWeight: '600', color: '#555' },
  pinsList: { marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20, fontSize: 14 },
  pinCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 2 },
  pinCardGreen: { borderColor: '#52B788' },
  pinCardRed: { borderColor: '#E63946' },
  pinHeader: { flexDirection: 'row', alignItems: 'center' },
  pinIcon: { fontSize: 24, marginRight: 10 },
  pinOwner: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  pinLoc: { fontSize: 13, color: '#666' },
  pinStatusText: { marginTop: 8, fontSize: 14, fontWeight: 'bold', color: '#2D6A4F' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#FFF', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B4332' },
  modalId: { fontSize: 13, color: '#777', marginBottom: 16 },
  modalDetails: { marginBottom: 20 },
  detailItem: { fontSize: 15, color: '#333', marginBottom: 8 },
  contactButton: { backgroundColor: '#2D6A4F', padding: 16, borderRadius: 10, marginBottom: 10 },
  contactButtonText: { color: '#FFF', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  closeButton: { padding: 12 },
  closeButtonText: { textAlign: 'center', color: '#666', fontWeight: 'bold' }
});
      
