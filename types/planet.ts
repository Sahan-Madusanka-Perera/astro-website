export interface PlanetMember {
  id: string;
  name: string;
  role: 'director' | 'manager';
  image: string;
  email?: string;
  bio?: string;
}

export interface Planet {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Logo path
  color: string; // Theme color for the planet
  director: PlanetMember;
  managers: PlanetMember[];
  responsibilities: string[];
}
