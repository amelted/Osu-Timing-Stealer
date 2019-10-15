const fs = require('fs')
const fsExtra = require('fs-extra')
const AdmZip = require('adm-zip');
const find = require('find');
var diffs = [];
/* Unzip and save to /map/ directory */

if(fs.existsSync('./map/')){ fsExtra.emptyDirSync('./map/'); fs.rmdirSync('./map/'); console.log(`Deleted Old Map`); }
console.log(`Extracting map.`)

var zip = new AdmZip(process.argv[2]);
zip.extractAllTo("./map/", /*overwrite*/ true);
console.log(`Finished extracting map.`)

fs.readdir(`./map/`, (err, files) => {
  files.forEach(file => {

	  if(file.endsWith('.osu')){
		fs.mkdirSync(`./${file}`);
		console.log(`Found difficulty:  ${file}`); 
		//var song = find.fileSync(/\/map\/.*\.(mp3)/g);
		find.file(/.*\.(mp3)/, "./map/", function(files) {
			console.log(files);
		})
		
		//diffs.push(file);
		var map = fs.readFileSync(`./map/${file}`, 'utf8');
		var meta = (map.slice(map.search('Metadata'), map.search('Source:'))).replace('Metadata]','')
		var bpm = map.slice(map.search('Events'), map.search('Colours'))
		bpm = bpm.replace(bpm.slice(bpm.search('Events]'), bpm.search('TimingPoints'), ''))
		bpm = bpm.replace('undefinedTimingPoints]','')
		bpm = bpm.split('\r\n')
		bpm = bpm.filter(function(bp){ return bp != ''})
		bpm = bpm[0].split(',')
		bpm = (60000 / bpm[1]).toFixed(2)
		
		//console.log(map.slice(map.search('TimingPoints'), map.search('Colours')).replace('[','').replace(']',''))
		var notes = map.slice(map.search('HitObjects')).replace('[','').replace(']','').replace('HitObjects\r\n','').split('\r\n')
		//console.log(notes[1])
		//console.log(meta);
		console.log(meta.slice(0,meta.search('TitleUnicode')))
		console.log(meta.slice(meta.search('Artist'), meta.search('ArtistUnicode:')))
		console.log(meta.slice(meta.search('Version')))
		console.log(`${bpm} bpm`)
		var beatTime = [];
		var bloqs = [];
		for(var i = 0; i < notes.length; i++){
			beatTime[i] = notes[i].split(',', 2)
			notes[i] = notes[i].replace(beatTime[i] + ',','')
			
			
			//console.log(notes[i].split(',', 1));
			//console.log((notes[i].split(',', 1) / ( 60 / bpm)) / 1000)
			bloqs.push((notes[i].split(',', 1) / ( 60 / bpm)) / 1000)
			bloqs[i] = `{"_time": ${bloqs[i]}, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8},`;
			
			bloqs = bloqs.filter(function(y){return y != '{"_time": 0, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8},'})
			//console.log(bloqs[i])
			/*{
			"_time": 74.04033660888672,
			"_lineIndex": 1,
			"_lineLayer": 0,
			"_type": 0,
			"_cutDirection": 8
			}*/
			
		}
		bloqs[bloqs.length-1] = bloqs[bloqs.length-1].replace('},','}')
		// creating write streams for info.dat and map
		var moop = fs.createWriteStream(`./${file}/ExpertPlusStandard.dat`, {flags:'w'});
		var infodat = fs.createWriteStream(`./${file}/info.dat`, {flags:'w'});
		// Writing info.dat
		infodat.write(`{"_version": "2.0.0","_songName": "${meta.slice(0,meta.search('TitleUnicode')).replace(/\r\n/gi,'').replace('Title:' ,'')}","_songSubName": "","_songAuthorName": "","_levelAuthorName": "","_beatsPerMinute": ${bpm},"_songTimeOffset": 0,"_shuffle": 0,"_shufflePeriod": 0.5,"_previewStartTime": 0,"_previewDuration": 15,"_songFilename": "you have to get the audio yourself cause im lazy (it should just be in the /map/ dirctory)","_coverImageFilename": "cover.jpg","_environmentName": "NiceEnvironment","_customData": {"_contributors": [],"_customEnvironment": "","_customEnvironmentHash": ""},"_difficultyBeatmapSets": [{"_beatmapCharacteristicName": "Standard","_difficultyBeatmaps": [{"_difficulty": "ExpertPlus","_difficultyRank": 9,"_beatmapFilename": "ExpertPlusStandard.dat", "_noteJumpMovementSpeed": 17,"_noteJumpStartBeatOffset": 0,"_customData": {"_difficultyLabel": "","_editorOffset": 0,"_editorOldOffset": 0,"_warnings": [],"_information": [],"_suggestions": [],"_requirements": []}}]}]}`)
		moop.write(`{"_version": "2.0.0","_BPMChanges": [],"_events": [], "_notes": [`)
		for(var i = 0;i < bloqs.length; i++){
			moop.write(bloqs[i])
		}
		moop.write(`],"_obstacles": [], "_bookmarks": []}`)
		console.log('Done with ' + file.replace('osu',''))
		
	  }
	  
  });
});