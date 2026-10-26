export const NIGERIA_STATES = [
  { code: "NG-AB", name: "Abia", zone: "SOUTH_EAST" },
  { code: "NG-AD", name: "Adamawa", zone: "NORTH_EAST" },
  { code: "NG-AK", name: "Akwa Ibom", zone: "SOUTH_SOUTH" },
  { code: "NG-AN", name: "Anambra", zone: "SOUTH_EAST" },
  { code: "NG-BA", name: "Bauchi", zone: "NORTH_EAST" },
  { code: "NG-BY", name: "Bayelsa", zone: "SOUTH_SOUTH" },
  { code: "NG-BE", name: "Benue", zone: "NORTH_CENTRAL" },
  { code: "NG-BO", name: "Borno", zone: "NORTH_EAST" },
  { code: "NG-CR", name: "Cross River", zone: "SOUTH_SOUTH" },
  { code: "NG-DE", name: "Delta", zone: "SOUTH_SOUTH" },
  { code: "NG-EB", name: "Ebonyi", zone: "SOUTH_EAST" },
  { code: "NG-ED", name: "Edo", zone: "SOUTH_SOUTH" },
  { code: "NG-EK", name: "Ekiti", zone: "SOUTH_WEST" },
  { code: "NG-EN", name: "Enugu", zone: "SOUTH_EAST" },
  { code: "NG-FC", name: "Federal Capital Territory", zone: "NORTH_CENTRAL" },
  { code: "NG-GO", name: "Gombe", zone: "NORTH_EAST" },
  { code: "NG-IM", name: "Imo", zone: "SOUTH_EAST" },
  { code: "NG-JI", name: "Jigawa", zone: "NORTH_WEST" },
  { code: "NG-KD", name: "Kaduna", zone: "NORTH_WEST" },
  { code: "NG-KN", name: "Kano", zone: "NORTH_WEST" },
  { code: "NG-KT", name: "Katsina", zone: "NORTH_WEST" },
  { code: "NG-KB", name: "Kebbi", zone: "NORTH_WEST" },
  { code: "NG-KO", name: "Kogi", zone: "NORTH_CENTRAL" },
  { code: "NG-KW", name: "Kwara", zone: "NORTH_CENTRAL" },
  { code: "NG-LA", name: "Lagos", zone: "SOUTH_WEST" },
  { code: "NG-NA", name: "Nasarawa", zone: "NORTH_CENTRAL" },
  { code: "NG-NI", name: "Niger", zone: "NORTH_CENTRAL" },
  { code: "NG-OG", name: "Ogun", zone: "SOUTH_WEST" },
  { code: "NG-ON", name: "Ondo", zone: "SOUTH_WEST" },
  { code: "NG-OS", name: "Osun", zone: "SOUTH_WEST" },
  { code: "NG-OY", name: "Oyo", zone: "SOUTH_WEST" },
  { code: "NG-PL", name: "Plateau", zone: "NORTH_CENTRAL" },
  { code: "NG-RI", name: "Rivers", zone: "SOUTH_SOUTH" },
  { code: "NG-SO", name: "Sokoto", zone: "NORTH_WEST" },
  { code: "NG-TA", name: "Taraba", zone: "NORTH_EAST" },
  { code: "NG-YO", name: "Yobe", zone: "NORTH_EAST" },
  { code: "NG-ZA", name: "Zamfara", zone: "NORTH_WEST" },
] as const;

export type NigeriaStateCode = (typeof NIGERIA_STATES)[number]["code"];

export type NigeriaZone = (typeof NIGERIA_STATES)[number]["zone"];

export function getStateByCode(code: string) {
  return NIGERIA_STATES.find((state) => state.code === code);
}

export function getZoneByStateCode(code: string) {
  return getStateByCode(code)?.zone;
}
