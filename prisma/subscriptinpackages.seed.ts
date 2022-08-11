enum PackageName {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export const subscriptionPackages = [
  {
    name: PackageName.BASIC,
    description: 'Basic package',
    duration: 1,
    price: '300',
  },
  {
    name: PackageName.STANDARD,
    description: 'Standard package',
    duration: 1,
    price: '700',
  },
  {
    name: PackageName.PREMIUM,
    description: 'Premium package',
    duration: 1,
    price: '1000',
  },
];
