const deck = document.querySelector('#deck');
const tonearm = document.querySelector('#tonearm');
const audio = document.querySelector('#recordAudio');
const startStopButton = document.querySelector('#startStopButton');
const PARKED_ANGLE = -38;
const PLAYING_ANGLE = -15;
const STATE_THRESHOLD = -26;
const BASE_ARM_ANGLE = 136.4;
let currentAngle = PARKED_ANGLE;
let dragging = false;
let playing = false;

if (audio) audio.volume = 0.4;

function setArm(angle) {
  currentAngle = Math.max(PARKED_ANGLE, Math.min(PLAYING_ANGLE, angle));
  tonearm.style.transform = `rotate(${currentAngle}deg) scale(.45)`;
}

function angleFromPointer(event) {
  const rect = deck.getBoundingClientRect();
  const pivotX = rect.left + rect.width * .8255;
  const pivotY = rect.top + rect.height * .3457;
  return Math.atan2(event.clientY - pivotY, event.clientX - pivotX) * 180 / Math.PI - BASE_ARM_ANGLE;
}

async function playRecord() {
  playing = true;
  dragging = false;
  tonearm.classList.remove('dragging');
  tonearm.style.removeProperty('transform');
  deck.classList.add('playing');
  tonearm.setAttribute('aria-pressed', 'true');
  startStopButton?.setAttribute('aria-pressed', 'true');
  try { await audio.play(); } catch (error) { console.warn('Audio could not start:', error); }
}

function parkRecord() {
  playing = false;
  dragging = false;
  audio.pause();
  deck.classList.remove('playing');
  tonearm.classList.remove('dragging');
  tonearm.setAttribute('aria-pressed', 'false');
  startStopButton?.setAttribute('aria-pressed', 'false');
  tonearm.style.removeProperty('transform');
  currentAngle = PARKED_ANGLE;
}

if (tonearm) {
  tonearm.addEventListener('pointerdown', event => {
    dragging = true;
    tonearm.classList.add('dragging');
    tonearm.setPointerCapture(event.pointerId);
    setArm(angleFromPointer(event));
  });
  tonearm.addEventListener('pointermove', event => { if (dragging) setArm(angleFromPointer(event)); });
  const releaseArm = () => {
    if (!dragging) return;
    dragging = false;
    tonearm.classList.remove('dragging');
    currentAngle >= STATE_THRESHOLD ? playRecord() : parkRecord();
  };
  tonearm.addEventListener('pointerup', releaseArm);
  tonearm.addEventListener('pointercancel', releaseArm);
  tonearm.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playing ? parkRecord() : playRecord();
    }
  });
}
if (startStopButton) startStopButton.addEventListener('click', () => playing ? parkRecord() : playRecord());

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

const lightbox = document.querySelector('#lightbox');
if (lightbox) {
  const lightboxImage = lightbox.querySelector('img');
  document.querySelectorAll('.piece').forEach(piece => piece.addEventListener('click', () => {
    const image = piece.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightbox.showModal();
  }));
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
}

const appointmentModal = document.querySelector('#appointmentModal');
document.querySelectorAll('.appointment-open').forEach(button => button.addEventListener('click', () => appointmentModal.showModal()));
if (appointmentModal) {
  appointmentModal.querySelector('.modal-close').addEventListener('click', () => appointmentModal.close());
  appointmentModal.addEventListener('click', event => { if (event.target === appointmentModal) appointmentModal.close(); });
}
