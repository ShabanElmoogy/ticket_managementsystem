import React from 'react';
import { View, Text } from 'react-native';
import s from './visits.styles';
import { getVisitCfg } from './visits.types';

interface Props { status: string }

const VisitBadge: React.FC<Props> = ({ status }) => {
  const cfg = getVisitCfg(status);
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '44' }]}>
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

export default VisitBadge;
