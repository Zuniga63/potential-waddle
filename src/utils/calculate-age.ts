export function calculateAge(birthDate: Date) {
  const today = new Date();
  const birthDate2 = new Date(birthDate);
  const age = today.getFullYear() - birthDate2.getFullYear();
  return age;
}
