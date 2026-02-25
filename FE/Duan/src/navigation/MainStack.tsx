import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ReportScreen } from '../screens/report/ReportScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { TaskListScreen } from '../screens/task/TaskListScreen';

export type MainTabParamList = {
	Dashboard: undefined;
	Tasks: undefined;
	Reports: undefined;
	Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainStack = () => (
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
