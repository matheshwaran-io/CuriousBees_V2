import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const FACULTY_DATA = {
  "FACULTY OF ENGINEERING AND TECHNOLOGY": [
    "Aerospace Engineering",
    "Automobile Engineering",
    "Biomedical Engineering",
    "Biotechnology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Computer Science and Business Systems",
    "Computer Science and Engineering (Artificial Intelligence and Machine Learning)",
    "Computer Science and Engineering (Data Science)",
    "Computer Science and Engineering (Cyber Security)",
    "Information Technology",
    "Software Engineering",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Electronics and Instrumentation Engineering",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Robotics and Automation",
    "Artificial Intelligence",
    "Artificial Intelligence and Data Science",
    "Data Science",
    "Network Engineering",
    "Nanotechnology",
    "Genetic Engineering"
  ],
  "FACULTY OF SCIENCE AND HUMANITIES": [
    "Computer Applications (MCA)",
    "Computer Science",
    "Information Systems",
    "Data Analytics",
    "Mathematics",
    "Statistics",
    "Physics",
    "Chemistry",
    "Biochemistry",
    "Microbiology",
    "Bioinformatics",
    "English and Foreign Languages",
    "Economics",
    "Psychology",
    "Public Policy",
    "Commerce",
    "Accounting and Finance",
    "Banking and Insurance",
    "Journalism and Mass Communication",
    "Visual Communication",
    "Digital Media",
    "Hotel and Catering Management",
    "Tourism and Hospitality Management"
  ],
  "FACULTY OF MANAGEMENT": [
    "Finance",
    "Marketing",
    "Human Resource Management",
    "Operations Management",
    "Business Analytics",
    "Entrepreneurship",
    "International Business",
    "Supply Chain Management",
    "Strategic Management",
    "Information Systems Management"
  ],
  "FACULTY OF LAW": [
    "Constitutional Law",
    "Corporate Law",
    "Criminal Law",
    "Intellectual Property Law",
    "Cyber Law",
    "Human Rights Law",
    "Environmental Law",
    "International Law",
    "Taxation Law",
    "Commercial Law"
  ],
  "FACULTY OF MEDICINE AND HEALTH SCIENCES": [
    "Anatomy",
    "Physiology",
    "Pathology",
    "Pharmacology",
    "Forensic Medicine",
    "Community Medicine",
    "General Medicine",
    "General Surgery",
    "Pediatrics",
    "Obstetrics and Gynecology",
    "Orthopedics",
    "Ophthalmology",
    "Dermatology",
    "Psychiatry",
    "ENT",
    "Radiology",
    "Anesthesiology",
    "Emergency Medicine",
    "Cardiology",
    "Neurology",
    "Nephrology",
    "Pulmonology",
    "Gastroenterology",
    "Oncology",
    "Oral Medicine",
    "Oral Surgery",
    "Orthodontics",
    "Periodontics",
    "Prosthodontics",
    "Conservative Dentistry",
    "Pedodontics",
    "Public Health Dentistry",
    "Pharmaceutics",
    "Pharmaceutical Chemistry",
    "Pharmacognosy",
    "Pharmacy Practice",
    "Medical Surgical Nursing",
    "Community Health Nursing",
    "Child Health Nursing",
    "Mental Health Nursing",
    "Obstetrics and Gynecological Nursing",
    "Musculoskeletal Physiotherapy",
    "Neurological Physiotherapy",
    "Cardiopulmonary Physiotherapy",
    "Sports Physiotherapy",
    "Pediatric Occupational Therapy",
    "Neurological Rehabilitation",
    "Community Rehabilitation",
    "Epidemiology",
    "Biostatistics",
    "Environmental Health",
    "Health Policy and Management"
  ],
  "RESEARCH CENTERS (Cross-Faculty)": [
    "Artificial Intelligence Research Center",
    "Data Science Research Center",
    "Cyber Security Research Center",
    "Internet of Things Research Center",
    "Robotics Research Center",
    "Renewable Energy Research Center",
    "Nanotechnology Research Center",
    "Biotechnology Research Center",
    "Healthcare Informatics Research Center",
    "Smart Manufacturing Research Center",
    "Advanced Materials Research Center",
    "Sustainable Development Research Center"
  ]
};

function generateCode(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 10);
}

async function main() {
  console.log('Seeding new departments without deleting old ones...');

  for (const [faculty, departments] of Object.entries(FACULTY_DATA)) {
    for (const deptName of departments) {
      const code = generateCode(deptName);
      const exists = await prisma.department.findUnique({ where: { name: deptName } });
      if (!exists) {
        // Find if another has the same code
        let uniqueCode = code;
        let count = 1;
        while (await prisma.department.findUnique({ where: { code: uniqueCode } })) {
          uniqueCode = code.substring(0, 8) + count;
          count++;
        }
        await prisma.department.create({
          data: {
            name: deptName,
            code: uniqueCode,
            description: `${deptName} under ${faculty}`
          }
        });
        console.log(`Created: ${deptName}`);
      }
    }
  }

  console.log('Done!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
