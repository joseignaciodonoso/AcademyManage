/**
 * Terminology helper for Academy vs Club
 * Returns appropriate terminology based on organization type
 */

export type OrganizationType = "ACADEMY" | "CLUB"

export const getTerminology = (type: OrganizationType) => {
  if (type === "CLUB") {
    return {
      // Singular
      member: "jugador",
      Member: "Jugador",
      student: "jugador",
      Student: "Jugador",
      player: "jugador",
      Player: "Jugador",
      
      // Plural
      members: "jugadores",
      Members: "Jugadores",
      students: "jugadores",
      Students: "Jugadores",
      players: "jugadores",
      Players: "Jugadores",
      
      // Actions
      enroll: "inscribir",
      Enroll: "Inscribir",
      enrollment: "inscripción",
      Enrollment: "Inscripción",
      
      // Other
      class: "entrenamiento",
      Class: "Entrenamiento",
      classes: "entrenamientos",
      Classes: "Entrenamientos",
    }
  }
  
  // ACADEMY terminology
  return {
    // Singular
    member: "alumno",
    Member: "Alumno",
    student: "alumno",
    Student: "Alumno",
    player: "alumno",
    Player: "Alumno",
    
    // Plural
    members: "alumnos",
    Members: "Alumnos",
    students: "alumnos",
    Students: "Alumnos",
    players: "alumnos",
    Players: "Alumnos",
    
    // Actions
    enroll: "inscribir",
    Enroll: "Inscribir",
    enrollment: "inscripción",
    Enrollment: "Inscripción",
    
    // Other
    class: "clase",
    Class: "Clase",
    classes: "clases",
    Classes: "Clases",
  }
}

// Quick access functions
export const getMemberTerm = (type: OrganizationType, capitalized = false) => {
  const terms = getTerminology(type)
  return capitalized ? terms.Member : terms.member
}

export const getMembersTerm = (type: OrganizationType, capitalized = false) => {
  const terms = getTerminology(type)
  return capitalized ? terms.Members : terms.members
}

export const getClassTerm = (type: OrganizationType, capitalized = false) => {
  const terms = getTerminology(type)
  return capitalized ? terms.Class : terms.class
}

export const getClassesTerm = (type: OrganizationType, capitalized = false) => {
  const terms = getTerminology(type)
  return capitalized ? terms.Classes : terms.classes
}
