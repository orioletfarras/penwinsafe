<template>
  <div class="max-w-2xl space-y-4">

    <div>
      <p class="text-[13px] font-semibold" style="color:#111827">Filtros de palabras clave</p>
      <p class="text-[11px] mt-0.5" style="color:#6b7280">
        El navegador PenwinSafe bloquea búsquedas que contengan estas palabras. Puedes activar/desactivar categorías y añadir términos personalizados.
      </p>
    </div>

    <!-- Categories -->
    <div v-for="cat in categories" :key="cat.id"
      class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">

      <!-- Cat header -->
      <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background:${cat.color}`"></span>
          <div>
            <p class="text-[12px] font-semibold" style="color:#111827">{{ cat.label }}</p>
            <p class="text-[11px]" style="color:#6b7280">{{ cat.desc }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[10px]" style="color:#9ca3af">
            {{ cat.keywords.length + (customWords[cat.id] || []).length }} palabras
          </span>
          <!-- Toggle switch -->
          <button @click="toggleCat(cat.id)"
            class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
            :style="enabledCats[cat.id] !== false ? 'background:#006fff' : 'background:#d1d5db'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :style="enabledCats[cat.id] !== false ? 'transform:translateX(16px)' : 'transform:translateX(0)'">
            </span>
          </button>
        </div>
      </div>

      <!-- Keywords -->
      <div class="px-4 py-3 space-y-3" :style="enabledCats[cat.id] === false ? 'opacity:0.4;pointer-events:none' : ''">

        <!-- Built-in chips -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="kw in (expandedCats[cat.id] ? cat.keywords : cat.keywords.slice(0, 20))" :key="kw"
            class="text-[10px] px-2 py-0.5 rounded font-medium"
            style="background:#f9fafb;color:#374151;border:1px solid #e5e7eb">
            {{ kw }}
          </span>
          <button v-if="cat.keywords.length > 20" @click="expandedCats[cat.id] = !expandedCats[cat.id]"
            class="text-[10px] px-2 py-0.5 rounded font-medium transition-colors"
            style="background:#eff6ff;color:#006fff;border:1px solid #bfdbfe">
            {{ expandedCats[cat.id] ? 'Ver menos' : `+ ${cat.keywords.length - 20} más` }}
          </button>
        </div>

        <!-- Custom words -->
        <div v-if="(customWords[cat.id] || []).length" class="flex flex-wrap gap-1.5">
          <span v-for="(kw, i) in customWords[cat.id]" :key="kw"
            class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium"
            style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
            {{ kw }}
            <button @click="removeCustom(cat.id, i)" class="ml-0.5 hover:text-red-500 transition-colors">×</button>
          </span>
        </div>

        <!-- Add custom word -->
        <div class="flex items-center gap-2">
          <input
            v-model="newWord[cat.id]"
            type="text"
            :placeholder="`Añadir palabra a ${cat.label}...`"
            class="flex-1 px-2.5 py-1.5 rounded text-[11px] focus:outline-none transition-colors"
            style="background:#f9fafb;border:1px solid #e5e7eb;color:#111827"
            @keydown.enter="addCustom(cat.id)" />
          <button @click="addCustom(cat.id)"
            class="text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors flex-shrink-0"
            style="background:#006fff;color:#ffffff">
            Añadir
          </button>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex items-center justify-between">
      <p v-if="savedMsg" class="text-[11px]" :class="savedMsg.includes('Error') ? 'text-red-600' : 'text-green-700'">{{ savedMsg }}</p>
      <span v-else></span>
      <button @click="saveFilters" :disabled="saving"
        class="text-[12px] font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
        style="background:#006fff;color:#ffffff">
        {{ saving ? 'Guardando...' : 'Guardar configuración' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const saving   = ref(false)
const savedMsg = ref('')

const BUILT_IN = {
  pornografia: [
    'porn','porno','pornografia','pornography','pornographic','porngif','porntube','pornstar','pornstars',
    'xxx','xxxx','xxxxx','x-rated','xrated','x rated','adult film','adult video','adult content',
    'sex video','sex videos','sex film','sex films','sex tape','sextape','sex clip','sex clips',
    'erotic video','erotic film','erotic movie','erotic clip','nude video','nude clip','nude film',
    'naked video','naked clip','amateur sex','amateur porn','homemade porn','homemade sex',
    'free porn','free sex video','watch porn','porn watch','porn free','porn online',
    'best porn','top porn','new porn','latest porn','hot porn','hardcore porn','softcore porn',
    'hentai','hentai manga','hentai anime','hentai comics','ecchi','yaoi','yuri hentai','doujin',
    'lemon fanfic','nsfw','nsfw content','nsfw video','nsfw image','18+','18 plus','over 18',
    'xvideos','pornhub','redtube','xnxx','xhamster','youporn','tube8','spankwire','extremetube',
    'brazzers','fakings','bangbros','naughtyamerica','realitykings','mofos','digitalplayground',
    'twistys','girlsdoporn','babes','teamskeet','wicked','evil angel','kink.com','kink','men.com',
    'chaturbate','bongacams','cam4','myfreecams','streamate','camsoda','jasmin','livejasmin',
    'stripchat','flirt4free','imlive','sexier','xcams','camster',
    'onlyfans','fansly','fancentro','manyvids','clips4sale','iwantclips','niteflirt',
    'pornmd','beeg','hclips','empflix','moviefap','drtuber','xbabe','porndig','pornone',
    'anysex','hdzog','veporn','txxx','vjav','javhd','javmost','javbus','jav','av idol',
    'asian porn','japanese porn','korean porn','chinese porn','thai porn','filipina porn',
    'indian porn','desi porn','hindi sex','bengali sex','pakistani sex',
    'arab sex','arabic porn','muslim sex','hijab porn',
    'ebony porn','black sex','interracial porn','bbc porn','latina porn',
    'russian sex','ukrainian sex','eastern european porn','czech porn',
    'teen porn','barely legal','18 teen porn','young porn','college sex tape',
    'mia khalifa','lana rhoades','riley reid','johnny sins','lisa ann','sunny leone',
    'alexis texas','madison ivy','dillion harper','phoenix marie','jessica jaymes',
    'jenna jameson','stormy daniels','august ames','eva lovia','abella danger',
    'elsa jean','adriana chechik','angela white','sasha grey','asa akira','ava addams',
    'brandi love','carter cruise','casey calvert','chanel preston','charlotte stokely',
    'cherie deville','christy mack','dani daniels','danika mori','darcie dolce',
    'ember snow','emily willis','eva elfie','gianna dior','honey gold','jade kush',
    'janice griffith','jessa rhodes','joanna angel','julia ann','kendra lust',
    'kiara mia','kiki minaj','kimmy granger','kleio valentien','kristen scott',
    'lela star','lexi belle','lexi luna','lexi lore','lily labeau','liya silver',
    'luna star','lyra law','maddy oreilly','maitland ward','mandy muse','marley brinx',
    'maya bijou','melissa moore','mia malkova','mia martinez','mila marx','mona wales',
    'morgan lee','naomi woods','natasha nice','nicolette shea','nina hartley',
    'nina north','nina elle','peta jensen','pierce paris','piper perri','presley hart',
    'rachael cavalli','reagan foxx','riley nixon','romi rain','ryan ryans',
    'samantha saint','sara jay','sarah banks','scarlett sage','serena blair','shyla stylez',
    'sydney cole','taylor vixen','teal conrad','tia cyrus','tori black',
    'valentina nappi','vanessa cage','veronica avluv','victoria june','violet myers',
    'whitney wright','zoey holloway','zoey monroe','zoe parker','zoe bloom',
    'james deen','manuel ferrara','tommy gunn','keiran lee','ryan madison','rocco siffredi',
    'nacho vidal','omar galanti','lexington steele','mandingo','shane diesel',
    'blowjob','blow job','handjob','hand job','rimjob','rim job','footjob',
    'creampie','cream pie','facial cum','cumshot','cum shot','jizz','bukake',
    'gangbang','gang bang','orgy','orgía','threesome','group sex','swinger',
    'bareback sex','raw sex','anal sex','anal porn','anal creampie','anal gangbang',
    'double penetration','dp porn','triple penetration','fisting','squirt porn',
    'squirting','female ejaculation','golden shower','watersports sex',
    'bdsm sex','bondage sex','rope bondage','hogtied','whipping sex','spanking porn',
    'domination sex','submission sex','slave sex','dungeon sex',
    'pegging','strapon sex','strap on sex','femdom',
    'voyeur sex','exhibitionist sex','public sex','outdoor sex','dogging',
    'incest porn','taboo porn','stepmom sex','stepdad sex','stepbrother sex','stepsister sex',
    'mom son sex','dad daughter sex','family sex','brother sister sex',
    'milf sex','cougar sex','granny sex','mature sex',
    'bbw sex','fat sex','chubby sex',
    'furry sex','furry porn','yiff',
    'foot fetish','feet sex','toe sucking','nylon fetish','pantyhose sex',
    'latex sex','leather sex','rubber sex',
    'interracial sex','cuckold','cuckolding','cuckquean','hotwife',
    'casting couch','fake casting','real amateur','real homemade sex',
  ],
  contenido_adulto: [
    'sexo','sex','sexual','sexuality','hacer el amor',
    'relaciones sexuales','relación sexual','acto sexual',
    'nude','nudes','nudez','desnudo','desnuda','desnudos','desnudas','desnudez',
    'naked','nakedness','semi desnudo','semi nude','topless','sin ropa',
    'erotic','erótico','erótica','erotismo','erotica',
    'onlyfans','fansly','sex work','trabajo sexual',
    'stripper','strip club','lap dance','lapdance','pole dance sexual',
    'escort','escorts','acompañante sexual','prostituta','prostitutas','prostitución',
    'prostitution','whore','puta','putas','meretriz',
    'camgirl','cam girl','webcam sex','webcam show','live sex',
    'sexting','sext','send nudes','manda nudes','foto desnuda',
    'dick pic','dick pictures','penis picture','vagina picture','boob picture',
    'flashing','exhibicionismo','exhibicionista',
    'tetas','teta','pechos desnudos','senos desnudos','pezones','nipple','nipples',
    'polla','pollas','pene','penes','verga','vergas','cock','cocks','dick','dicks',
    'vagina','vaginas','coño','coños','pussy','cunt','vulva','vulvas',
    'culo','culos','ass','asses','butt','buttocks','nalgas',
    'clitoris','clítoris','glande','escroto','testículos',
    'follar','folla','follando','follada','joder','jodiendo',
    'corrida','corridas','orgasmo','orgasmos','orgasm',
    'mamada','mamadas','chupada','chupadas','cunnilingus','fellatio',
    'masturbacion','masturbarse','masturbate','masturbation',
    'pajear','paja','pajas',
    'fetish','fetiche','kink','kinky','perverted','pervertido',
    'bdsm','bondage','dominación','dominatrix','sumisión',
    'sadomasoquismo','sadismo','masoquismo',
    'roleplay sexual','fantasía sexual',
    'swing','swinger','intercambio de parejas',
    'lencería sexual','lingerie sexual','sexy underwear','ropa interior sexy',
    'sex toy','sex toys','juguete sexual','vibrador','vibrators',
    'dildo','dildos','consolador','consoladores','plug anal','butt plug',
    'cock ring','anillo peneano',
    'tinder sex','grindr sex','scruff sex','manhunt sex',
    'adam4adam','gaydar sex','squirt sex','recon bdsm','fetlife','alt.com',
    'ashley madison','seeking arrangement','sugar daddy sex','sugar baby sex',
    'adult friendfinder','sex dating',
    'reddit nsfw','reddit gone wild','reddit gonewild','r/gonewild','r/nsfw',
    'twitter nsfw','instagram nude','snapchat nudes','telegram nude','discord nsfw',
    'tumblr nsfw','tumblr porn','4chan nsfw','4chan b',
    'hentai','ecchi','doujinshi','doujin adult','manga adult','anime adult',
    'phone sex','chat sexual','chat sex',
  ],
  violencia: [
    'gore','gore video','gore videos','gore site','best gore','bestgore',
    'liveleak','liveleak murder','liveleak death',
    'graphic violence','graphic death','graphic murder',
    'snuff','snuff film','snuff video','snuff movie',
    'beheading','beheading video','decapitation','decapitation video',
    'decapitate','head cut off','cutting head','guillotine execution',
    'torture','torture video','torture porn','torture chamber',
    'execution video','execution footage','public execution','live execution',
    'murder video','murder footage','real murder',
    'stabbing video','stabbing footage','knife attack video','machete attack',
    'shooting video','shooting footage','gunshot video','real shooting',
    'suicide video','suicide footage','suicide method','how to suicide',
    'suicide guide','metodos de suicidio','como suicidarse','tutorial suicidio',
    'jumping suicide','hanging suicide','cutting suicide','wrist cutting',
    'self harm video','self harm method','how to self harm','cómo hacerse daño',
    'car crash death video','explosion video','bombing video','terrorist attack video',
    'war footage','war crimes video','genocide footage','massacre video',
    'lynching','lynching video','racial violence video',
    'animal cruelty','animal torture','animal killing video','animal abuse',
    'fight video','brutal fight','street fight','knockout video',
    'gang fight','mob attack video','mob violence',
    'school shooting','mass shooting how to','attack planning',
    'pipe bomb how to','bomb making','ied construction','explosive device',
    'knife how to kill','weapon to kill','how to make weapon',
    'isis execution','isil beheading','al qaeda attack','terrorist execution',
    'jihad violence','martyrdom video','attack infidels','kill kafir',
    'white nationalist attack','domestic terrorism guide',
    'mass murder planning','rampage shooting','manifesto shooter',
    'revenge porn','non consensual porn','leaked sex tape revenge',
    'como stalkear','how to stalk','stalking guide',
    'doxxing guide','dox someone','reveal personal info','find home address',
    'swatting guide','fake police report',
    'death threat','amenaza de muerte','kill threat',
    'bomb threat','school bomb','school threat','attack school',
  ],
  drogas: [
    'cocaina','cocaína','cocaine','coke drug','crack cocaine','crack drug',
    'heroina','heroína','heroin','junk drug','smack drug','dope drug',
    'metanfetamina','methamphetamine','meth drug','crystal meth','ice drug',
    'anfetamina','amphetamine','speed drug','adderall abuse','ritalin abuse',
    'mdma','éxtasis','extasis','ecstasy drug','molly drug','mandy drug',
    'lsd','acid drug','lysergic acid','trip drug',
    'ketamina','ketamine','special k drug',
    'ghb drug','gamma hydroxybutyrate','liquid ecstasy','date rape drug',
    'rohypnol','roofie drug','rape drug',
    'pcp drug','angel dust drug','phencyclidine',
    'fentanilo','fentanyl','opioid drug','opiáceo','overdose fentanyl',
    'oxicodona','oxycodone','oxycontin drug','percocet abuse','hydrocodone abuse',
    'tramadol abuse','codeine abuse','morfina','morphine drug','opium drug',
    'cannabis','marihuana','marijuana','weed drug','ganja','mary jane drug',
    'hash drug','hashish','concentrates weed','dabs drug','shatter drug',
    'thc drug','cannabinoids','420 drug',
    'hongos psicodelicos','magic mushrooms','shrooms drug','psilocybin',
    'mescalina','mescaline','peyote drug','dmt drug','ayahuasca drug',
    'salvia drug','salvia divinorum','2cb drug','research chemical',
    'poppers drug','amyl nitrate','nitrous oxide drug','laughing gas drug',
    'inhalantes','inhalants drug','huffing drug','sniffing glue',
    'benzodiacepinas','benzodiazepines','xanax abuse','valium abuse',
    'steroids drug','anabolic steroids','doping',
    'synthetic drug','designer drug','bath salts drug','flakka','spice drug',
    'como comprar droga','comprar cocaina','comprar heroina','comprar mdma',
    'comprar speed','comprar anfetamina','comprar metanfetamina','comprar éxtasis',
    'comprar lsd','comprar ketamina','comprar fentanilo','comprar marihuana',
    'comprar weed','comprar hash','comprar hongos',
    'donde comprar droga','conseguir droga','dealer droga','mi dealer',
    'drug dealer','buy drugs','buy cocaine','buy heroin','buy meth',
    'buy mdma','buy ecstasy','buy weed','buy marijuana','buy lsd','buy ketamine',
    'buy fentanyl','buy amphetamine','buy speed','buy crack',
    'order drugs online','drugs online shop','drugs marketplace',
    'darknet drugs','dark web drugs','deep web drugs','tor drugs',
    'silk road drugs','dream market drugs','drug vendor',
    'drug telegram','drug whatsapp','drug signal',
    'como hacer droga','fabricar droga','sintetizar droga',
    'cook meth','meth lab','cook crack','how to make crack',
    'how to make cocaine','cocaine synthesis','heroin synthesis',
    'inyectarse droga','inject drug','needle drug','shoot up drug',
    'esnifar cocaina','snort cocaine','snorting drugs',
    'fumar crack','smoke crack','freebase cocaine','speedball drug',
    'colocado droga','subido droga','high drug','stoned drug','trippy drug',
    'druggie','junkie','adicto','adicción droga','drug addiction',
    'bad trip','comedown drug',
    'drug paraphernalia','pipes drug','bong','grinder drug','rolling papers drug',
    'tin foil drug','spoon drug','syringe drug buy',
  ],
  apuestas: [
    'casino online','casino en línea','casino en linea','online casino','internet casino',
    'casino virtual','casino gratis','casino real money','casino dinero real',
    'casino app','casino mobile','jugar casino',
    'bet365','betway','bwin','888casino','888sport','william hill','ladbrokes',
    'unibet','1xbet','22bet','betsson','betfair','draftkings','fanduel',
    'pointsbet','betmgm','caesars sportsbook','wynn bet',
    'sportingbet','coral betting','paddy power','sky bet','betvictor',
    'interwetten','pinnacle','melbet','leonbets',
    'codere','marca apuestas','sportium','kirolbet',
    'ruleta online','ruleta casino','roulette online',
    'blackjack online','blackjack casino','black jack dinero','poker real money',
    'poker online dinero','texas holdem real',
    'baccarat online','bacará online',
    'tragaperras','tragamonedas','slot machine','slots online','slots casino',
    'slot machine dinero','slots real money','jackpot slots',
    'progressive jackpot','mega jackpot','jackpot online',
    'bingo online','bingo dinero','bingo real money',
    'keno online','lottery online','lotería online',
    'scratch card online','rasca y gana online','instant win game',
    'craps online','dados casino',
    'apuestas deportivas','sports betting','sports bet',
    'apuestas fútbol','football betting','bet on football',
    'apuestas tenis','tennis betting','apuestas baloncesto','basketball betting',
    'apuestas béisbol','baseball betting','apuestas mma','mma betting','ufc betting',
    'apuestas boxeo','boxing betting','apuestas esports','esports betting',
    'apuestas carreras caballos','horse racing betting',
    'apuestas virtuales','virtual sports betting',
    'live betting','apuestas en vivo','in play betting',
    'handicap bet','spread betting','over under bet',
    'accumulator bet','parlay bet','teaser bet','combo bet',
    'free bet','bonus bet','welcome bonus casino',
    'pokerstars','partypoker','ggpoker','888poker','winamax',
    'poker stars','poker en línea','poker online dinero real',
    'crypto casino','bitcoin casino','ethereum casino','crypto betting',
    'bitcoin gambling','crypto gambling','nft gambling',
    'stake casino','rollbit','roobet','bc.game','cloudbet','bitcasino',
    'ludopatia','ludopatía','gambling addiction','problem gambling',
    'como ganar casino','ganar ruleta sistema','ganar en el casino',
    'casino cheat','beat the casino','casino trick','win casino hack',
    'martingale casino','fibonacci casino',
    'euromillones','el gordo lotería','primitiva','bonoloto','cupón once',
    'mega millions lottery','powerball lottery','uk lottery','eurojackpot',
  ],
  odio: [
    'nazismo','nazista','nazi','nazis','national socialism',
    'neonazi','neo nazi','neo-nazi','third reich','reich heil',
    'heil hitler','sieg heil','adolf hitler worship','mein kampf propaganda',
    'swastika','hakenkreuz','ss insignia','waffen ss glorify',
    'white supremacy','white supremacist','white power','white pride worldwide',
    'white nationalist','white nationalism','alt right extremist',
    'aryan race','aryan nation','aryan brotherhood','aryan pride',
    'kkk','ku klux klan','clan klan','klan rally','klansman',
    'proud boys extremist','oath keepers extremist','patriot front',
    'atomwaffen division','the base extremist','the order white supremacist',
    'stormfront','daily stormer','counter currents',
    'accelerationism','accelerationist','race war','race war now',
    'racism propaganda','racist propaganda','racial supremacy',
    'racial inferiority','master race','untermensch',
    'odio racial','racismo','racista','discriminación racial',
    'racial slur','racial slurs','insulto racial',
    'matar negros','matar gitanos','matar inmigrantes','matar judíos',
    'kill blacks','kill jews','kill muslims','kill immigrants',
    'hate blacks','hate jews','hate muslims','hate immigrants',
    'black lives dont matter','jews control world',
    'replace white people','great replacement conspiracy',
    'ethnic cleansing','limpieza étnica','racial cleansing',
    'antisemitism','antisemitismo','anti semitic',
    'jewish conspiracy','jewish world domination','jews control media',
    'jews control banks','zionist conspiracy','rothschild conspiracy',
    'holocaust denial','holohoax','deny holocaust',
    'gas the jews','final solution glorify','exterminate jews',
    'islamofobia','islamophobia','anti muslim','kill muslims',
    'muslim terrorism glorify','bomb mosque','attack muslims',
    'kill arabs','hate arabs','all muslims terrorists',
    'ban islam','islam is evil',
    'xenofobia','xenophobia','foreigners go home','immigrants go back',
    'homofobia','homophobia','gay slur','anti gay hate','kill gays',
    'hang gays','faggot hate','queer insult','dyke insult',
    'transphobia','transfobia','kill trans','attack trans',
    'gay agenda conspiracy','homosexual agenda',
    'misoginia','misogyny','women deserve violence','rape women',
    'incel extremist','incel violence','incel revenge','incel manifesto',
    'blackpill extremist','redpill misogyny','mgtow extreme',
    'femicide glorify','kill women','beat women',
    'terrorismo','terrorism glorify','terror attack support',
    'isis propaganda','isil propaganda','al qaeda support','hamas propaganda',
    'islamic state support','jihadist propaganda',
    'recruit terrorism','radicalize online','join isis','join al qaeda',
    'martyr terrorism','bomb infidels','kill infidels',
    'lone wolf attack','manifesto killer','incel attack',
    'hate speech','discurso de odio','hate site',
    'propaganda hate','odio propaganda','incitement to violence',
    'dehumanize minority','dehumanize group',
    'subhuman group','vermin ethnic','pest ethnic','parasite ethnic',
  ],
}

const categories = [
  { id: 'pornografia',      label: 'Pornografía',       color: '#dc2626', desc: 'Sitios y búsquedas de contenido sexual explícito',   keywords: BUILT_IN.pornografia },
  { id: 'contenido_adulto', label: 'Contenido adulto',  color: '#ea580c', desc: 'Desnudos, erótico, plataformas adultas',             keywords: BUILT_IN.contenido_adulto },
  { id: 'violencia',        label: 'Violencia',         color: '#b91c1c', desc: 'Vídeos gore, ejecuciones, torturas',                 keywords: BUILT_IN.violencia },
  { id: 'drogas',           label: 'Drogas',            color: '#7c3aed', desc: 'Compra y venta de sustancias ilegales',              keywords: BUILT_IN.drogas },
  { id: 'apuestas',         label: 'Apuestas',          color: '#d97706', desc: 'Casinos online, apuestas deportivas',                keywords: BUILT_IN.apuestas },
  { id: 'odio',             label: 'Discurso de odio',  color: '#475569', desc: 'Racismo, nazismo, incitación al odio',              keywords: BUILT_IN.odio },
]

const customWords  = reactive({})
const enabledCats  = reactive({})
const expandedCats = reactive({})
const newWord      = reactive({})
const orgId        = ref('')

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: admin } = await supabase.from('admin_users').select('org_id').eq('id', user.id).single()
  if (!admin) return
  orgId.value = admin.org_id

  // Load saved filter config from org settings (stored in organizations.filter_config jsonb)
  const { data: org } = await supabase.from('organizations').select('filter_config').eq('id', admin.org_id).single()
  const config = org?.filter_config || {}

  categories.forEach(cat => {
    customWords[cat.id]  = config[cat.id]?.custom || []
    enabledCats[cat.id]  = config[cat.id]?.enabled !== false
    newWord[cat.id]      = ''
  })
})

function toggleCat(id) {
  enabledCats[id] = enabledCats[id] === false ? true : false
}

function addCustom(catId) {
  const w = (newWord[catId] || '').trim().toLowerCase()
  if (!w) return
  if (!customWords[catId]) customWords[catId] = []
  if (!customWords[catId].includes(w)) customWords[catId].push(w)
  newWord[catId] = ''
}

function removeCustom(catId, idx) {
  customWords[catId].splice(idx, 1)
}

async function saveFilters() {
  if (!orgId.value) return
  saving.value = true
  savedMsg.value = ''

  const config = {}
  categories.forEach(cat => {
    config[cat.id] = {
      enabled: enabledCats[cat.id] !== false,
      custom:  customWords[cat.id] || [],
    }
  })

  const { error } = await supabase
    .from('organizations')
    .update({ filter_config: config })
    .eq('id', orgId.value)

  saving.value = false
  savedMsg.value = error ? `Error: ${error.message}` : 'Configuración guardada'
  setTimeout(() => savedMsg.value = '', 3000)
}
</script>
