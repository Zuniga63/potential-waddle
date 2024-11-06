export function calculateAge(birthDate: Date) {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  return age;
}
