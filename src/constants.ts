import { Project, CareerMilestone } from './types';

// Master Google Drive showcase folder link for Ayush's Full HD Masters
export const MASTER_DRIVE_FOLDER = '';

export interface DriveOrMailAction {
  url: string;
  isDrive: boolean;
  label: string;
  tooltip: string;
  target: '_blank' | '_self';
}

export const getDriveOrMailAction = (project?: Project | null): DriveOrMailAction => {
  const hasDriveLink = !!(project?.driveUrl && project.driveUrl.trim().length > 0);
  
  if (hasDriveLink) {
    return {
      url: project!.driveUrl!,
      isDrive: true,
      label: 'Drive HD',
      tooltip: 'Open Full HD Master on Google Drive',
      target: '_blank'
    };
  }

  // If link is not found, automatically send request to mail
  const email = 'ak4895931@gmail.com';
  const title = project?.title || 'Video Edit';
  const client = project?.client || 'Client';
  const year = project?.year || '2026';
  const subject = encodeURIComponent(`Request Full HD Master: ${title}`);
  const body = encodeURIComponent(
    `Hi Ayush,\n\nI would like to request the Full HD / 4K master edit of:\n- Project: ${title}\n- Client: ${client}\n- Year: ${year}\n\nPlease share the Google Drive access link with me.\n\nThank you!`
  );

  return {
    url: `mailto:${email}?subject=${subject}&body=${body}`,
    isDrive: false,
    label: 'Drive HD',
    tooltip: `Request Full HD Master via email (${email})`,
    target: '_self'
  };
};

export const getDriveUrl = (project?: Project | null): string => {
  return getDriveOrMailAction(project).url;
};

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Intro',
    client: 'Self-Directed',
    year: '2025',
    thumbnail: '/photos/INSTRUCTION.png',
    videoUrl: '/videos/sabrina.mov',
    duration: '00:14',
    tags: ['Color Grade', 'VFX', 'Sound'],
    description: 'A visual exploration of a futuristic cityscape using advanced color grading and custom sound design.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    sphereOnly: true,
    spherePosition: [8, 0, 0]
  },
  {
    id: 'p2',
    title: 'TEXTURE MOTION EDIT',
    client: 'NIMBUS',
    year: '2023',
    thumbnail: '/photos/TEXTURE_MOTION_EDIT.png',
    videoUrl: '/videos/khtmsdfgh_1_41.mp4',
    duration: '01:41',
    tags: ['Rhythm Edit', 'Motion'],
    description: 'High-energy rhythmic editing showcase for a lifestyle brand campaign.',
    idealGrade: 'BLEACH',
    aspectRatio: '16:9',
    category: 'MOTION',
    featured: true,
    spherePosition: [5.66, 5.66, 0]
  },
  {
    id: 'p3',
    title: 'MOTION EDIT',
    client: 'NIMBUS',
    year: '2025',
    thumbnail: '/photos/MOTION_EDIT.png',
    videoUrl: '/videos/nimbuuexportvjbjk_20.mp4',
    duration: '00:20',
    tags: ['Corporate', 'Minimal'],
    description: 'Clean, professional corporate overview for a manufacturing giant.',
    idealGrade: 'REC709',
    aspectRatio: '16:9',
    
    spherePosition: [0, 8, 0]
  },
  {
    id: 'p4',
    title: 'LOGO ANIMATION',
    client: 'VIBHAV',
    year: '2024',
    thumbnail: '/photos/LOGO_ANIMATION_1.png',
    videoUrl: '/videos/vibhav_Comp_4.mp4',
    duration: '00:04',
    tags: ['Music', 'Abstract'],
    description: 'Abstract visuals paired with deep house rhythms.',
    idealGrade: 'LOG',
    aspectRatio: '16:9',
    spherePosition: [-5.66, 5.66, 0]
  },
  {
    id: 'p5',
    title: 'COMMERCIAL REEL',
    client: 'Trago Media',
    year: '2024',
    thumbnail: '/photos/COMMERCIAL.png',
    videoUrl: '/videos/final_53.mp4',
    duration: '00:53',
    tags: ['Commercial', 'Social Hook', 'Color Grade'],
    description: 'High-energy 9:16 commercial showcase engineered for retention, fast cuts, and punchy product hooks.',
    idealGrade: 'REC709',
    aspectRatio: '9:16',
    category: 'COMMERCIAL',
    featured: true,
    spherePosition: [-8, 0, 0]
  },
  {
    id: 'p6',
    title: 'WEEDING MOTION ANIMATION',
    client: 'Streetwear Label',
    year: '2025',
    thumbnail: '/photos/WEEDING_MOTION_ANIMATION.png',
    videoUrl: '/videos/weeding_51.mp4',
    duration: '00:51',
    tags: ['Fashion', 'Edgy'],
    description: 'High-contrast fashion film shot in urban Tokyo with bleach-bypass color grade.',
    idealGrade: 'BLEACH',
    aspectRatio: '16:9',
    category: 'COMMERCIAL',
    spherePosition: [-5.66, -5.66, 0]
  },
  {
    id: 'p7',
    title: 'MATCHCUT EDIT',
    client: 'TragoMedia',
    year: '2023',
    thumbnail: '/photos/MATCHCUT_EDIT.png',
    videoUrl: '/videos/comment_almost_intro.mp4',
    duration: '00:07',
    tags: ['Match Cut', 'Rhythm'],
    description: 'Precision match-cut sequence synchronizing subject motion across different environments.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    category: 'REEL',
    spherePosition: [0, -8, 0]
  },
  {
    id: 'p8',
    title: 'LINEART ANIMATION',
    client: 'NIMBUS',
    year: '2024',
    thumbnail: '/photos/LINEART_ANIMATION.png',
    videoUrl: '/videos/intro_7.mp4',
    duration: '00:07',
    tags: ['Reels', 'Vertical'],
    description: 'A collection of the best golden hour moments across Europe.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    
    spherePosition: [5.66, -5.66, 0]
  },
  {
    id: 'p9',
    title: 'PRODUCT ANIMATION',
    client: 'RTX',
    year: '2023',
    thumbnail: '/photos/PRODUCT_ANIMATION.png',
    videoUrl: '/videos/rtxfinal_36.mp4',
    duration: '00:36',
    tags: ['Product', '3D Motion', 'Lighting'],
    description: 'High-fidelity 3D product rendering, kinetic camera moves, and sleek lighting transitions.',
    idealGrade: 'CINEMA',
    aspectRatio: '9:16',
    category: 'MOTION',
    featured: true,
    spherePosition: [0, 0, 8]
  },
  {
    id: 'p10',
    title: 'SHORT FILM',
    client: 'NIMBUS',
    year: '2024',
    thumbnail: '/photos/SHORT_FILM.png',
    videoUrl: '/videos/super_final_koladeio_1_12.mp4',
    duration: '01:12',
    tags: ['Music Video', 'Stylistic', 'Narrative'],
    description: 'Experimental music video featuring heavy glitch effects, rhythmic pacing, and fast-paced intercutting.',
    idealGrade: 'MONO',
    aspectRatio: '16:9',
    category: 'NARRATIVE',
    featured: true,
    spherePosition: [0, 0, -8]
  },
  {
    id: 'p11',
    title: 'HOODIE MOCKUP',
    client: 'TEDX',
    year: '2025',
    thumbnail: '/photos/HOODIE_MOCKUP.png',
    videoUrl: '/videos/VID-20260205-WA0004_13-1.mp4',
    duration: '00:13',
    tags: ['Apparel', 'Product Animation'],
    description: 'Streetwear apparel motion mockup with dynamic textile physics and clean studio lighting.',
    idealGrade: 'CINEMA',
    aspectRatio: '1:1',
    category: 'COMMERCIAL',
    spherePosition: [4, 4, 5.66]
  },
  {
    id: 'p12',
    title: 'ORIENTATION REEL',
    client: 'VIBHAV',
    year: '2024',
    thumbnail: '/photos/ORIENTATION_REEL.png',
    videoUrl: '/videos/ori_1_4.mp4',
    duration: '01:04',
    tags: ['Tech', 'Dataviz'],
    description: 'Visualizing global data flows in a sleek, modern aesthetic.',
    idealGrade: 'REC709',
    aspectRatio: '16:9',
    spherePosition: [-4, 4, 5.66]
  },
  {
    id: 'p13',
    title: 'PROMOTIONAL EDIT',
    client: 'VIBHAV',
    year: '2023',
    thumbnail: '/photos/PROMOTIONAL_EDIT_1.png',
    videoUrl: '/videos/team_37.mp4',
    duration: '00:37',
    tags: ['Scientific', 'Slow'],
    description: 'Underwater exploration of bioluminescent species.',
    idealGrade: 'CINEMA',
    aspectRatio: '9:16',
    
    spherePosition: [-4, -4, 5.66]
  },
  {
    id: 'p14',
    title: 'MASKING EDIT REEL',
    client: 'Self_Project',
    year: '2023',
    thumbnail: '/photos/MASKING_EDIT_REEL.png',
    videoUrl: '/videos/triund_16.mov',
    duration: '00:16',
    tags: ['Nature', 'Storytelling'],
    description: 'Documentary style narrative focused on the ecosystem of the Redwood forests.',
    idealGrade: 'REC709',
    aspectRatio: '16:9',
    
    
    spherePosition: [4, -4, 5.66]
  },
  {
    id: 'p15',
    title: 'TEXTURE MOTION EDIT',
    client: 'NIMBUS',
    year: '2023',
    thumbnail: '/photos/TEXTURE_MOTION_EDIT.png',
    videoUrl: '/videos/khtmsdfgh_1_41.mp4',
    duration: '01:41',
    tags: ['Urban', 'Architecture'],
    description: 'Rhythmic study of urban movement and infrastructure.',
    idealGrade: 'BLEACH',
    aspectRatio: '16:9',
    spherePosition: [4, 4, -5.66]
  },
  {
    id: 'p16',
    title: 'EVENT PROMOTION REEL',
    client: 'VIBHAV',
    year: '2023',
    thumbnail: '/photos/EVENT_PROMOTION_REEL.png',
    videoUrl: '/videos/IMG_6930_1_18.mp4',
    duration: '01:18',
    tags: ['Adventure', 'Climbing'],
    description: 'Documentation of a solo ascent in the Himalayas.',
    idealGrade: 'LOG',
    aspectRatio: '9:16',
    
    
    spherePosition: [-4, 4, -5.66]
  },
  {
    id: 'p17',
    title: 'PROMOTIONAL REEL',
    client: 'VIBHAV',
    year: '2025',
    thumbnail: '/photos/PROMOTIONAL_REEL_2.png',
    videoUrl: '/videos/final_v_day.mp4',
    duration: '00:37',
    tags: ['Innovation', 'Abstract'],
    description: 'Visualizing the birth of an idea in the digital age.',
    idealGrade: 'MONO',
    aspectRatio: '9:16',
    spherePosition: [-4, -4, -5.66]
  },
  {
    id: 'p18',
    title: 'EDIT',
    client: 'NIMBUS',
    year: '2024',
    thumbnail: '/photos/TOGO.png',
    videoUrl: '/videos/compiled.mp4',
    duration: '00:24',
    tags: ['Music', 'Visuals'],
    description: 'Reactive visuals that dance to a complex synth score.',
    idealGrade: 'CINEMA',
    aspectRatio: '9:16',
    
    spherePosition: [4, -4, -5.66]
  },
  {
    id: 'p19',
    title: 'MASKING EDIT PRE NIMBUS',
    client: 'NIMBUS',
    year: '2025',
    thumbnail: '/photos/MASKING_EDIT_prenimbus.png',
    videoUrl: '/videos/pre_46.mp4',
    duration: '00:46',
    tags: ['Action', 'High-Speed'],
    description: 'Intense trackside footage captured at 240fps.',
    idealGrade: 'BLEACH',
    aspectRatio: '9:16',
    
    spherePosition: [5.66, 0, 5.66]
  },
  {
    id: 'p20',
    title: 'SABRINA KISS',
    client: 'Self-Directed',
    year: '2025',
    thumbnail: '/photos/SABRINA_KISS.png',
    videoUrl: '/videos/sabrina.mov',
    duration: '00:14',
    tags: ['Color Grade', 'VFX', 'Sound'],
    description: 'A visual exploration of a futuristic cityscape using advanced color grading and custom sound design.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    category: 'NARRATIVE',
    spherePosition: [-5.66, 0, 5.66]
  },
  {
    id: 'p21',
    title: 'CINEMATIC ODYSSEY',
    client: 'Surf Brand',
    year: '2023',
    thumbnail: '/photos/ORIENTATION_REEL.png',
    videoUrl: '/videos/sabrina_14.mov',
    duration: '00:14',
    tags: ['Color Grade', 'Atmospheric'],
    description: 'Atmospheric slow-burn sequence capturing coastal solitude and raw texture.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    category: 'NARRATIVE',
    unclickable: true,
    comingSoon: true,
    spherePosition: [-5.66, 0, -5.66]
  },
  {
    id: 'p22',
    title: 'MOUNTAIN EXPEDITION',
    client: 'Alpine Brand',
    year: '2023',
    thumbnail: '/photos/MASKING_EDIT_REEL.png',
    videoUrl: '/videos/triund_16.mov',
    duration: '00:16',
    tags: ['Sports', 'Vibrant'],
    description: 'High-altitude documentary edit showcasing rugged trail ascents and natural light.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    category: 'REEL',
    unclickable: true,
    comingSoon: true,
    spherePosition: [5.66, 0, -5.66]
  },
  {
    id: 'p23',
    title: 'CRYSTAL CLEAR',
    client: 'Luxury Jewelry',
    year: '2024',
    thumbnail: '/photos/PRODUCT_ANIMATION.png',
    videoUrl: '/videos/comment_almost_intro.mp4',
    duration: '00:30',
    tags: ['Macro', 'Product'],
    description: 'Ultra-macro study of light refraction in high-end jewelry and polished metal.',
    idealGrade: 'REC709',
    aspectRatio: '1:1',
    category: 'COMMERCIAL',
    unclickable: true,
    comingSoon: true,
    spherePosition: [0, 5.66, 5.66]
  },
  {
    id: 'p24',
    title: 'URBAN KINETIC REEL',
    client: 'Streetwear Label',
    year: '2023',
    thumbnail: '/photos/TEXTURE_MOTION_EDIT.png',
    videoUrl: '/videos/nim_40.mp4',
    duration: '00:40',
    tags: ['Streetwear', 'Rhythm'],
    description: 'Fast-cut montage capturing downtown metropolitan life and raw street fashion.',
    idealGrade: 'CINEMA',
    aspectRatio: '16:9',
    category: 'REEL',
    unclickable: true,
    comingSoon: true,
    spherePosition: [0, -5.66, -5.66]
  }
];

export const MILESTONES: CareerMilestone[] = [
  { id: 'm1', year: '2018', event: 'Started Editing', type: 'education', color: '#4a90e2', timestamp: 10 },
  { id: 'm2', year: '2020', event: 'First Commercial', type: 'project', color: '#50e3c2', timestamp: 30 },
  { id: 'm3', year: '2021', event: 'Adobe Certified', type: 'education', color: '#f5a623', timestamp: 45 },
  { id: 'm4', year: '2022', event: 'VFX Course', type: 'education', color: '#d0021b', timestamp: 65 },
  { id: 'm5', year: '2023', event: 'Best Short Edit', type: 'award', color: '#bd10e0', timestamp: 85 },
];
