(()=>{
'use strict';
const VERSION='1.0.2';
const PREF_KEY='homebase_daily_quote_enabled_v1';
let midnightTimer=null;
const QUOTES=[
 "Algún día darías mucho por volver a un día normal como hoy.",
 "Muchas últimas veces ocurren sin que nadie diga que son la última.",
 "No puedes recuperar una tarde que viviste distraído.",
 "Cada día estás intercambiando una parte de tu vida por algo. Mira qué estás comprando.",
 "Tu atención es tu vida. Donde la pones, la estás gastando.",
 "No dejes que cuidar tu futuro te haga perder aquello para lo que querías ese futuro.",
 "Un día dejarán de llamarte para que mires algo. No habrá aviso.",
 "Las personas que quieres no necesitan siempre más de ti. A veces necesitan más de ti aquí.",
 "Tus hijos aprenderán qué hacer con sus errores mirando qué haces tú con los tuyos.",
 "Si reaccionas mal cuando te dicen la verdad, no te sorprendas cuando empiecen a ocultártela.",
 "Tus hijos no necesitan verte perfecto. Necesitan verte reparar cuando te equivocas.",
 "Lo que haces cuando pierdes la paciencia educa más que muchas conversaciones sobre paciencia.",
 "La forma en que te hablas a ti mismo también les está enseñando cómo hablarse a ellos mismos.",
 "Proteger a alguien de todas las dificultades también puede protegerlo de descubrir que puede superarlas.",
 "La incertidumbre no significa que algo vaya mal. Significa que todavía no sabes qué pasará.",
 "Tu mente puede fabricar un desastre mucho antes de que la realidad haya decidido nada.",
 "La necesidad de certeza puede costarte más que la incertidumbre.",
 "Si necesitas saber cómo termina antes de empezar, empezarás muy pocas cosas importantes.",
 "Una mente cansada puede convertir una posibilidad en una amenaza sin que haya cambiado nada fuera.",
 "No todo pensamiento necesita una respuesta. Algunos desaparecen si no los conviertes en un problema.",
 "Pensar más no siempre es profundizar. A veces es negarte a aceptar que todavía no sabes.",
 "El ruido mental crece cuando tratas cada duda como si necesitara una conclusión inmediata.",
 "Hay decisiones que no necesitan más información. Necesitan valor.",
 "A veces no estás confundido. Simplemente no te gusta la respuesta que ya conoces.",
 "Si ya sabes qué debes hacer, seguir pensando puede ser otra forma de no hacerlo.",
 "Tu vida cambia cuando algunas decisiones dejan de estar abiertas a negociación.",
 "No confundas alivio inmediato con una buena decisión.",
 "Una buena decisión puede tener un mal resultado. Sigue siendo una buena decisión.",
 "No decidir también escribe tu futuro.",
 "Esperar a estar seguro es una decisión con sus propios riesgos.",
 "La disciplina es proteger una decisión del estado de ánimo del momento.",
 "Cada excepción que repites está dejando de ser una excepción.",
 "Lo que haces ocasionalmente muestra tus intenciones. Lo que repites muestra tu dirección.",
 "No necesitas más disciplina. Necesitas menos decisiones que dependan de ella.",
 "Lo difícil no es empezar. Es seguir cuando ya no es nuevo.",
 "Cuando una decisión importante depende cada día de cómo te sientes, todavía no está del todo decidida.",
 "Aceptar lo que ha ocurrido no significa que te guste. Significa dejar de luchar contra un hecho.",
 "Soltar no es dejar de preocuparte. Es dejar de intentar decidir algo que nunca estuvo bajo tu control.",
 "No necesitas controlar lo que ocurre para decidir quién eres dentro de lo que ocurre.",
 "Parte del sufrimiento nace de la distancia entre lo que ocurre y lo que creías que debía ocurrir.",
 "La esperanza no es creer que saldrá bien. Es seguir actuando aunque no sepas cómo saldrá.",
 "La culpa útil corrige algo. La culpa que ya no corrige nada solo te sigue castigando.",
 "No es que no sepas qué quieres. Es que te da miedo lo que costaría.",
 "La excusa más peligrosa es la que suena razonable.",
 "No eres quien dices ser. Eres lo que haces cuando nadie lo va a saber.",
 "Explicar por qué eres así no es lo mismo que decidir si quieres seguir siéndolo.",
 "La mentira más peligrosa suele ser la que consigues justificarte a ti mismo.",
 "Cambiar de idea con dignidad es más difícil que mantenerla por orgullo.",
 "La inteligencia también consiste en saber qué evidencia te haría cambiar de opinión.",
 "La presión no crea tus hábitos. Solo deja menos espacio para esconderlos.",
 "El dinero compra opciones, no sentido. Confundir eso sale caro.",
 "Ganar más no arregla lo que no era un problema de dinero.",
 "Un trabajo puede pagarte bien y aun así cobrarte demasiado de quien eres.",
 "No es lo mismo ser bueno en tu trabajo que estar de acuerdo con lo que ese trabajo te pide ser.",
 "Puedes tener éxito en algo y aun así estar construyendo la vida equivocada.",
 "Puedes avanzar muy deprisa en una dirección que nunca elegiste conscientemente.",
 "Si nunca defines qué es suficiente, ningún logro podrá parecerlo.",
 "A veces no necesitas más ambición. Necesitas una definición más clara de para qué.",
 "La confianza no se rompe de golpe. Se rompe en cuotas pequeñas que nadie señala.",
 "Se puede querer a alguien y aun así no ser bueno para su vida.",
 "Una pareja no se descuida de golpe. Se descuida cada vez que otra cosa parece un poco más urgente.",
 "Querer a alguien no compensa indefinidamente tratarlo mal.",
 "Poner un límite no siempre aleja a la gente adecuada. A veces revela quién necesitaba que no lo tuvieras.",
 "La intimidad se pierde cuando dejas de preguntar porque crees que ya conoces la respuesta.",
 "Algunas amistades no se rompen; simplemente dejan de recibir tiempo de ambas partes.",
 "Cada límite que no pones a tiempo acaba apareciendo en forma de resentimiento.",
 "La comparación puede convertir una vida buena en una vida que parece insuficiente.",
 "Antes de añadir algo a tu vida, pregúntate qué va a desplazar.",
 "La envidia es medir tu vida con la regla de otro.",
 "Nadie envidia el precio que pagó el otro. Solo el resultado.",
 "La envidia puede señalar un deseo que todavía no has tenido el valor de admitir.",
 "No sacrifiques años tranquilos para impresionar durante unos minutos.",
 "No tienes tiempo ilimitado para nada, ni siquiera para lo que más te importa.",
 "La muerte no hace la vida triste. Le pone fecha límite a las excusas.",
 "Todo lo que tienes es prestado, incluido el tiempo que crees tener de sobra.",
 "La finitud no es el enemigo de una buena vida. Es lo que la hace importar.",
 "La salud no se nota como ganancia diaria. Se nota de golpe, como pérdida.",
 "El cuerpo no negocia contigo cuando ya te ha fallado. Solo negocia antes.",
 "No esperes a que tu cuerpo te obligue a valorar lo que todavía puede hacer.",
 "Envejecer también es descubrir que algunas cosas que parecían urgentes nunca fueron importantes.",
 "Quien no sabe estar solo suele elegir mal compañía por no estarlo.",
 "Huir de estar contigo mismo tiene un precio que pagas en todas tus relaciones.",
 "Hay cosas sobre ti que solo escuchas cuando nadie más está hablando.",
 "Cuando necesitas estímulo constante, hasta lo importante empieza a parecer demasiado lento.",
 "La atención fragmentada no solo roba tiempo. Te acostumbra a no permanecer suficiente en nada para entenderlo.",
 "Si cada momento vacío te incomoda, quizá no te falte entretenimiento sino tolerancia a estar contigo.",
 "Un fracaso bien mirado es información. Mal mirado, es una sentencia.",
 "Protegerte del fracaso también te protege de todo lo que valía la pena intentar.",
 "Tus errores ocupan mucho más espacio en tu cabeza que en la memoria de los demás.",
 "Llegar tarde a una verdad sigue siendo mejor que seguir huyendo de ella.",
 "No cambias cuando entiendes que deberías. Cambias cuando el precio de seguir igual se vuelve más caro que el miedo a cambiar.",
 "El coraje rara vez se siente como coraje mientras lo estás usando. Suele sentirse como miedo y una decisión.",
 "Hay momentos en los que seguir igual exige más renuncias que cambiar.",
 "Puedes no tener culpa de dónde empezaste y aun así ser el único responsable de dónde sigues.",
 "Echar la culpa fuera alivia rápido y cuesta caro: te quita también el poder de cambiarlo.",
 "Atribuir tu éxito solo al esfuerzo, o solo a la suerte, son dos formas distintas de no ver bien lo que pasó.",
 "Hay gente preparada que nunca tuvo la oportunidad, y gente con oportunidad que nunca se preparó. Las dos cosas son verdad a la vez.",
 "Agradecer lo que tienes no te impide querer más. Evita que necesites más para poder estar bien.",
 "Escuchar una crítica sin defenderte de inmediato es más difícil que la crítica misma.",
 "Ser responsable no es cargar con todo. Es dejar de fingir que no puedes hacer nada."
];
function byId(id){return document.getElementById(id)}
function enabled(){return localStorage.getItem(PREF_KEY)!=='0'}
function setEnabled(value){localStorage.setItem(PREF_KEY,value?'1':'0');apply()}
function dayNumber(date=new Date()){
 return Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000)
}
function quoteIndex(date=new Date()){
 const n=dayNumber(date);
 return ((n*37+17)%QUOTES.length+QUOTES.length)%QUOTES.length
}
function quoteFor(date=new Date()){return QUOTES[quoteIndex(date)]}
function installStyles(){
 if(byId('homebaseDailyQuoteStyles'))return;
 const s=document.createElement('style');s.id='homebaseDailyQuoteStyles';s.textContent=`
 .hb-daily-quote{margin:-11px 2px 10px;padding:1px 2px 2px 0;background:transparent}
 .hb-daily-quote-text{position:relative;margin:0;padding:0 8px 0 15px;font-family:ui-serif,"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-size:13.5px;font-style:italic;font-weight:500;line-height:1.38;letter-spacing:-.02px;color:#756b62}
 .hb-daily-quote-text::before{content:'“';position:absolute;left:0;top:-4px;font-size:23px;font-style:normal;font-weight:600;line-height:1;color:rgba(217,120,31,.52)}
 .hb-daily-quote-text::after{content:'”';margin-left:2px;font-size:16px;font-style:normal;font-weight:600;line-height:1;color:rgba(217,120,31,.52)}
 .hb-quote-pref-section{margin-top:18px}
 .hb-quote-pref-card{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 16px;background:var(--surface,#fffdf9);border:1px solid rgba(235,228,218,.75);border-radius:18px;box-shadow:0 8px 24px rgba(38,31,24,.06)}
 .hb-quote-pref-copy{min-width:0}.hb-quote-pref-title{font-weight:850;font-size:15px;color:var(--text,#182230)}.hb-quote-pref-sub{margin-top:3px;font-size:12px;line-height:1.35;color:var(--muted,#7e8793)}
 .hb-quote-switch{position:relative;flex:0 0 auto;width:48px;height:29px;border:0;border-radius:999px;padding:0;background:#d6d9dd;transition:background .18s ease;-webkit-tap-highlight-color:transparent}
 .hb-quote-switch::after{content:'';position:absolute;left:3px;top:3px;width:23px;height:23px;border-radius:50%;background:white;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:transform .18s ease}
 .hb-quote-switch[aria-checked="true"]{background:#d9781f}.hb-quote-switch[aria-checked="true"]::after{transform:translateX(19px)}
 @media(max-width:520px){.hb-daily-quote{margin-top:-12px;margin-bottom:9px}.hb-daily-quote-text{font-size:13px;line-height:1.38;padding-left:14px}.hb-daily-quote-text::before{font-size:22px}}
 `;
 document.head.appendChild(s)
}
function ensureQuote(){
 const page=byId('todayPage');if(!page)return;
 let box=byId('homebaseDailyQuote');
 if(!box){
  box=document.createElement('div');box.id='homebaseDailyQuote';box.className='hb-daily-quote';box.setAttribute('aria-label','Frase del día');
  const p=document.createElement('p');p.className='hb-daily-quote-text';box.appendChild(p);
  const hero=page.querySelector('.hero-row');if(hero)hero.insertAdjacentElement('afterend',box);else page.prepend(box)
 }
 const text=box.querySelector('.hb-daily-quote-text');if(text)text.textContent=quoteFor();
 box.hidden=!enabled()
}
function ensurePreference(){
 const page=byId('morePage');if(!page)return;
 let section=byId('homebaseDailyQuotePreference');
 if(!section){
  section=document.createElement('div');section.id='homebaseDailyQuotePreference';section.className='section hb-quote-pref-section';
  section.innerHTML='<div class="section-head"><h2>Preferencias</h2></div><div class="hb-quote-pref-card"><div class="hb-quote-pref-copy"><div class="hb-quote-pref-title">Frase del día</div><div class="hb-quote-pref-sub">Muestra una reflexión distinta cada día en Hoy.</div></div><button type="button" class="hb-quote-switch" role="switch" aria-label="Mostrar frase del día"></button></div>';
  const hero=page.querySelector('.hero-row');if(hero)hero.insertAdjacentElement('afterend',section);else page.prepend(section);
  section.querySelector('.hb-quote-switch')?.addEventListener('click',()=>setEnabled(!enabled()))
 }
 const sw=section.querySelector('.hb-quote-switch');if(sw)sw.setAttribute('aria-checked',enabled()?'true':'false')
}
function scheduleMidnightRefresh(){
 clearTimeout(midnightTimer);
 const now=new Date();
 const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,80);
 midnightTimer=setTimeout(()=>{apply();scheduleMidnightRefresh()},Math.max(1000,next-now))
}
function apply(){installStyles();ensureQuote();ensurePreference()}
function install(){
 apply();scheduleMidnightRefresh();
 window.addEventListener('pageshow',()=>{apply();scheduleMidnightRefresh()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){apply();scheduleMidnightRefresh()}});
 document.addEventListener('click',e=>{if(e.target?.closest?.('.bottom-nav [data-page]'))setTimeout(apply,0)},true);
 setTimeout(apply,250);setTimeout(apply,1200)
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
window.HOMEBASE_DAILY_QUOTES={version:VERSION,quotes:QUOTES.slice(),apply,enabled,setEnabled,quoteFor,quoteIndex};
})();