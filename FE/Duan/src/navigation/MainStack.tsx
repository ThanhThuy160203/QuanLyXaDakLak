import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ReportScreen } from '../screens/report/ReportScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { TaskListScreen } from '../screens/task/TaskListScreen';

export type MainTabParamList = {
	Dashboard: undefined;
	Tasks: undefined;
	Reports: undefined;
	Settings: undefined;
};

export type MainStackParamList = {
	Tabs: undefined;
	Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const MainTabs = () => (
	<Tab.Navigator
		screenOptions={({ route }) => ({
			headerShown: false,
			tabBarActiveTintColor: '#1D4ED8',
			tabBarInactiveTintColor: '#94A3B8',
			tabBarLabelStyle: { fontWeight: '600' },
			tabBarIcon: ({ color }) => (
				<Text style={{ color, fontSize: 18 }}>{getTabIcon(route.name)}</Text>
			),
		})}
	>
		<Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
		<Tab.Screen name="Tasks" component={TaskListScreen} options={{ title: 'Nhiệm vụ' }} />
		<Tab.Screen name="Reports" component={ReportScreen} options={{ title: 'Báo cáo' }} />
		<Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài đặt' }} />
	</Tab.Navigator>
);

export const MainStack = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="Tabs"
			component={MainTabs}
			options={{ headerShown: false }}
		/>
		<Stack.Screen
			name="Profile"
			component={ProfileScreen}
			options={{ title: 'Hồ sơ cá nhân' }}
		/>
	</Stack.Navigator>
);

const getTabIcon = (routeName: keyof MainTabParamList) => {
	switch (routeName) {
		case 'Dashboard':
			return 'D';
		case 'Tasks':
			return 'T';
		case 'Reports':
			return 'R';
		case 'Settings':
			return 'S';
		default:
			return '*';
	}
};
