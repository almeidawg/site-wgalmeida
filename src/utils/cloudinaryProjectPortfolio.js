import { buildCloudinaryImageUrl } from '@/utils/cloudinaryMedia';

const buildProjectImageSet = (publicId) => ({
  thumbSrc: buildCloudinaryImageUrl(publicId, [
    'f_auto',
    'q_auto:good',
    'dpr_auto',
    'c_fill,g_auto',
    'w_900,h_900',
  ]),
  fullSrc: buildCloudinaryImageUrl(publicId, [
    'f_auto',
    'q_auto:good',
    'dpr_auto',
    'c_limit,w_1800,h_1800',
  ]),
});

const buildProjectGallerySources = (publicIds) =>
  publicIds.map((publicId) => buildProjectImageSet(publicId).fullSrc);

const mapImagesToCloudinarySources = (images = [], publicIds = []) => {
  if (!Array.isArray(images)) {
    return [];
  }

  if (!publicIds?.length) {
    return images;
  }

  return images
    .map((image, index) => {
      const publicId = publicIds[index];
      if (!publicId) return image;
      const sources = buildProjectImageSet(publicId);

      return {
        ...image,
        src: sources.thumbSrc,
        thumbSrc: sources.thumbSrc,
        fullSrc: sources.fullSrc,
      };
    })
    .filter(Boolean);
};

const PROJECT_PORTFOLIO_PUBLIC_IDS = {
  1: [
    'kt97bidolunvjzryp23u',
    'xna4ou5w5zkbxr14mky7',
    'deykdwqtjj0pfhaqporj',
    'h1ihcp4efxpemzpintxn',
  ],
  2: [
    'qpykk4kmh9s9yyo4dkcj',
    'xpr0yajevxmbygbrkfhv',
    'na5ab83dhqvbujorchck',
    'lkmvw0w3xx8tjjrxucqs',
    'rwi4pnbzpxfj8uzdqqg4',
    'hxtpzmv9fzeqfxnyetxr',
  ],
  3: [
    'f2xnn7swjc2b4s5nn8d1',
    'qmbxpcginnlrjynqhgzy',
    'y1chdhh3z1n5h1hrovm6',
    'xj5l4ev3fnioubifhpnn',
    'at245n3l2p8kcurj9cpe',
    'feclul0gt97xkybd1zth',
    'zfvwpmtmnpfzdlkomx5h',
    'eu1oxhffdxu12hlzplta',
    'at1ecgqzym6bwbojur9k',
    'wq2bvkgbrw75afff7eqe',
  ],
  4: [
    'hxmscyqjoibfu8muihvs',
    'wq4pdjfxwjeedwrzgi3p',
    'on27bjutditqmp4t3mli',
    'qdcwv0mpcudkzbnssfi0',
  ],
  // ENG-OBRA EM ANDAMENTO - PERDIZES - 127M²-21
  5: [
    'euxmuej9knkschbkgtyx',
    'fvho9fdmlu4iooa49my1',
    'ihjigy5lnlr5stle2jut',
    'v0kx6e2ex9ygp7hzewhq',
    'on5zcc0if0jzq6laycac',
  ],
  // ENG-MORUMBI-160M²-93-95
  6: [
    'tcta4lsv6tl548eh74kp',
    'gxjocyybo9vhpgsyksqo',
    'iz7fwsm84x1z5u0zza8d',
  ],
};

const PHOTO_GALLERY_PUBLIC_IDS = {
  1: [
    'hxmscyqjoibfu8muihvs',
    'wq4pdjfxwjeedwrzgi3p',
    'on27bjutditqmp4t3mli',
  ],
  2: [
    'tcta4lsv6tl548eh74kp',
    'gxjocyybo9vhpgsyksqo',
    'iz7fwsm84x1z5u0zza8d',
  ],
  3: [
    'at1ecgqzym6bwbojur9k',
    'mjiapl6ycby5i9bpwght',
    'wq2bvkgbrw75afff7eqe',
  ],
  4: [
    'kt97bidolunvjzryp23u',
    'xna4ou5w5zkbxr14mky7',
    'deykdwqtjj0pfhaqporj',
  ],
};

export const PROJECT_PORTFOLIO_OVERRIDES = {
  1: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[1]),
  2: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[2]),
  3: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[3]),
  4: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[4]),
  5: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[5]),
  6: buildProjectGallerySources(PROJECT_PORTFOLIO_PUBLIC_IDS[6]),
};

export const PROJECT_SERVICE_HIGHLIGHTS = {
  architecture: buildProjectImageSet('kt97bidolunvjzryp23u').fullSrc,
  carpentry: buildProjectImageSet('on27bjutditqmp4t3mli').fullSrc,
};

export const PREMIUM_INTRO_PORTFOLIO_IMAGES = buildProjectGallerySources([
  'hxmscyqjoibfu8muihvs',
  'qpykk4kmh9s9yyo4dkcj',
  'f2xnn7swjc2b4s5nn8d1',
  'kt97bidolunvjzryp23u',
]);

export const PROJECT_CAROUSEL_IMAGES = buildProjectGallerySources([
  'hxmscyqjoibfu8muihvs',
  'wq4pdjfxwjeedwrzgi3p',
  'on27bjutditqmp4t3mli',
  'qpykk4kmh9s9yyo4dkcj',
  'xpr0yajevxmbygbrkfhv',
  'na5ab83dhqvbujorchck',
  'f2xnn7swjc2b4s5nn8d1',
  'qmbxpcginnlrjynqhgzy',
  'kt97bidolunvjzryp23u',
  'at245n3l2p8kcurj9cpe',
  'tcta4lsv6tl548eh74kp',
]);

export const resolvePortfolioProjectImages = (project) =>
  mapImagesToCloudinarySources(project?.images, PROJECT_PORTFOLIO_PUBLIC_IDS[project?.id]);

export const resolvePhotoGalleryProjects = (projects = []) => {
  if (!Array.isArray(projects)) return [];

  return projects.map((project) => ({
    ...project,
    images: mapImagesToCloudinarySources(
      project?.images,
      PHOTO_GALLERY_PUBLIC_IDS[project?.id]
    ),
  }));
};

export const PROJECT_GALLERY_IMAGES = [
  {
    id: 1,
    ...buildProjectImageSet('hxmscyqjoibfu8muihvs'),
    titleKey: 'projectGallery.titles.apartmentBrooklin',
    categoryKey: 'projectGallery.categories.integratedLiving',
  },
  {
    id: 2,
    ...buildProjectImageSet('wq4pdjfxwjeedwrzgi3p'),
    titleKey: 'projectGallery.titles.apartmentBrooklin',
    categoryKey: 'projectGallery.categories.livingRoom',
  },
  {
    id: 3,
    ...buildProjectImageSet('on27bjutditqmp4t3mli'),
    titleKey: 'projectGallery.titles.apartmentBrooklin',
    categoryKey: 'projectGallery.categories.kitchen',
  },
  {
    id: 4,
    ...buildProjectImageSet('qdcwv0mpcudkzbnssfi0'),
    titleKey: 'projectGallery.titles.apartmentBrooklin',
    categoryKey: 'projectGallery.categories.suite',
  },
  {
    id: 5,
    ...buildProjectImageSet('qpykk4kmh9s9yyo4dkcj'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.reception',
  },
  {
    id: 6,
    ...buildProjectImageSet('xpr0yajevxmbygbrkfhv'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.meetingRoom',
  },
  {
    id: 7,
    ...buildProjectImageSet('na5ab83dhqvbujorchck'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.office',
  },
  {
    id: 8,
    ...buildProjectImageSet('lkmvw0w3xx8tjjrxucqs'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.workspace',
  },
  {
    id: 9,
    ...buildProjectImageSet('rwi4pnbzpxfj8uzdqqg4'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.reception',
  },
  {
    id: 10,
    ...buildProjectImageSet('hxtpzmv9fzeqfxnyetxr'),
    titleKey: 'projectGallery.titles.corporateAlphaville',
    categoryKey: 'projectGallery.categories.workspace',
  },
  {
    id: 11,
    ...buildProjectImageSet('at245n3l2p8kcurj9cpe'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.commonArea',
  },
  {
    id: 12,
    ...buildProjectImageSet('feclul0gt97xkybd1zth'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.leisure',
  },
  {
    id: 13,
    ...buildProjectImageSet('kt97bidolunvjzryp23u'),
    titleKey: 'projectGallery.titles.guarujaHome',
    categoryKey: 'projectGallery.categories.facade',
  },
  {
    id: 14,
    ...buildProjectImageSet('xna4ou5w5zkbxr14mky7'),
    titleKey: 'projectGallery.titles.guarujaHome',
    categoryKey: 'projectGallery.categories.outdoorArea',
  },
  {
    id: 15,
    ...buildProjectImageSet('deykdwqtjj0pfhaqporj'),
    titleKey: 'projectGallery.titles.guarujaHome',
    categoryKey: 'projectGallery.categories.pool',
  },
  {
    id: 16,
    ...buildProjectImageSet('h1ihcp4efxpemzpintxn'),
    titleKey: 'projectGallery.titles.guarujaHome',
    categoryKey: 'projectGallery.categories.living',
  },
  {
    id: 17,
    ...buildProjectImageSet('f2xnn7swjc2b4s5nn8d1'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.facade',
  },
  {
    id: 18,
    ...buildProjectImageSet('qmbxpcginnlrjynqhgzy'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.commonArea',
  },
  {
    id: 19,
    ...buildProjectImageSet('y1chdhh3z1n5h1hrovm6'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.leisure',
  },
  {
    id: 20,
    ...buildProjectImageSet('xj5l4ev3fnioubifhpnn'),
    titleKey: 'projectGallery.titles.portaDoSol',
    categoryKey: 'projectGallery.categories.landscaping',
  },
];

export default PROJECT_GALLERY_IMAGES;
