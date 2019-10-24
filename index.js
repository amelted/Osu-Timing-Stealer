/* dependencys */
const fs = require('fs')
    const fsExtra = require('fs-extra')
    const AdmZip = require('adm-zip');
const find = require('find');

const ogg = require('ogg');
const vorbis = require('vorbis');
const ffmpeg = require('fluent-ffmpeg');
/* end of dependencys */
var oe = new ogg.Encoder();
var ve = new vorbis.Encoder();
var diffs = [];
/* Unzip and save to /map/ directory */

if (fs.existsSync('./map/')) {
    fsExtra.emptyDirSync('./map/');
    fs.rmdirSync('./map/');
    console.log(`Deleted Old Map`);
}
console.log(`Extracting map.`)

var zip = new AdmZip(process.argv[2]);
zip.extractAllTo("./map/", /*overwrite*/ true);
console.log(`Finished extracting map.`)

fs.readdir(`./map/`, (err, files) => {
    files.forEach(file => {

        if (file.endsWith('.osu')) {
            if (fs.existsSync(`./${file}`)) {
                fsExtra.emptyDirSync(`./${file}`);
                fs.rmdirSync(`./${file}`)
            }
            fs.mkdirSync(`./${file}`);
            console.log(`Found difficulty:  ${file}`);

            //find the mp3 and turn to ogg
            find.file(/.*\.(mp3)/, "./map/", function (files) {
                fs.copyFileSync(files[0], `./${file}/song.mp3`);
                ffmpeg(`./${file}/song.mp3`).toFormat('ogg').output(`./${file}/song.ogg`).on('end', function () {
                    console.log('Copied mp3 to file, and sucessfully converted it.');
                }).run()

            })
            //read map file
            var map = fs.readFileSync(`./map/${file}`, 'utf8');
            var meta = (map.slice(map.search('Metadata'), map.search('Source:'))).replace('Metadata]', '')
            var bpm = map.slice(map.search('Events'), map.search('Colours'))
                bpm = bpm.replace(bpm.slice(bpm.search('Events]'), bpm.search('TimingPoints'), ''))
                bpm = bpm.replace('undefinedTimingPoints]', '')
                bpm = bpm.split('\r\n')
                bpm = bpm.filter(function (bp) {
                    return bp != ''
                })
                bpm = bpm[0].split(',')
                var beatDuration = bpm
                bpm = (60000 / bpm[1]).toFixed(2)

                var notes = map.slice(map.search('HitObjects')).replace('[', '').replace(']', '').replace('HitObjects\r\n', '').split('\r\n')
                var diff = map.slice(map.search('Difficulty'), map.search(`Events`)) /*.replace(/[/g,'').replace(/]/g,'')*/.replace('Difficulty\r\n', '').split('\r\n').filter(function (g) {
                    return g != '['
                }).filter(function (g) {
                    return g != ''
                })
                var breaks = map.slice(map.search('//Break Periods'), map.search('Layer 0')).replace('\r\n', '').replace('//Storyboard', '').replace('//Break Periods', '').split('\r\n').filter(function (bp) {
                    return bp != ' '
                })
                // slider duration = pixelLength / (100.0 * diff[5]) * beatDuration
                console.log(meta.slice(0, meta.search('TitleUnicode')))
                console.log(meta.slice(meta.search('Artist'), meta.search('ArtistUnicode:')))
                console.log(meta.slice(meta.search('Version')))
                console.log(`${bpm} bpm`)
                console.log(`Found ${breaks.length} break(s)`)

                var beatTime = [];
            var bloqs = [];
            for (var i = 0; i < notes.length; i++) {
                beatTime[i] = notes[i].split(',', 2)
                    notes[i] = notes[i].replace(beatTime[i] + ',', '')
					//console.log(notes[i])
					pixelLength = notes[i].split(',')[5]
					//console.log(pixelLength)
					if(pixelLength = 'undefined'){
						bloqs.push((notes[i].split(',', 1) / (60 / bpm)) / 1000)
						bloqs[i] = `{"_time": ${bloqs[i]}, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8},`;
					}else{
						bloqs.push((notes[i].split(',', 1) / (60 / bpm)) / 1000)
						bloqs[i] = `{"_time": ${bloqs[i]}, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8}, {"_time": ${ bloqs [i] + (((pixelLength / (100.0 * diff[5]) * beatDuration) / (60 / bpm)) / 1000)}, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8}`;						
					}


                bloqs = bloqs.filter(function (y) {
                        return y != '{"_time": 0, "_lineIndex": 1, "_lineLayer": 0, "_type": 0, "_cutDirection": 8},'
                    })

                    /*{
                    "_time": 74.04033660888672,
                    "_lineIndex": 1,
                    "_lineLayer": 0,
                    "_type": 0,
                    "_cutDirection": 8
                    }*/

            }
            bloqs[bloqs.length - 1] = bloqs[bloqs.length - 1].replace('},', '}')
                // creating write streams for info.dat and map
                var moop = fs.createWriteStream(`./${file}/ExpertPlusStandard.dat`, {
                    flags: 'w'
                });
            var infodat = fs.createWriteStream(`./${file}/info.dat`, {
                    flags: 'w'
                });
            // Writing info.dat
			// note[7]
            /*infodat.write*/ var info = `{"_version": "2.0.0","_songName": "${meta.slice(0,meta.search('TitleUnicode')).replace(/\r\n/gi,'').replace('Title:' ,'')}","_songSubName": "","_songAuthorName": "","_levelAuthorName": "","_beatsPerMinute": ${bpm},"_songTimeOffset": 0,"_shuffle": 0,"_shufflePeriod": 0.5,"_previewStartTime": 0,"_previewDuration": 15,"_songFilename": "song.ogg","_coverImageFilename": "cover.jpg","_environmentName": "NiceEnvironment","_customData": {"_contributors": [],"_customEnvironment": "","_customEnvironmentHash": ""},"_difficultyBeatmapSets": [{"_beatmapCharacteristicName": "Standard","_difficultyBeatmaps": [{"_difficulty": "ExpertPlus","_difficultyRank": 9,"_beatmapFilename": "ExpertPlusStandard.dat", "_noteJumpMovementSpeed": 17,"_noteJumpStartBeatOffset": 0,"_customData": {"_difficultyLabel": "","_editorOffset": 0,"_editorOldOffset": 0,"_warnings": [],"_information": [],"_suggestions": [],"_requirements": []}}]}]}`
			
			info = JSON.stringify(JSON.parse(info), false, 4)
			infodat.write(info)
			
			moop.write(`{"_version": "2.0.0","_BPMChanges": [],"_events": [], "_notes": [`)
            for (var i = 0; i < bloqs.length; i++) {
                moop.write(bloqs[i])
            }
            moop.write(`],"_obstacles": [], `);
            var breakStartTimes = [];
			var breakEndTimes = [];
            if (breaks != 'undefined') {

                moop.write(`"_bookmarks": [`)

                breaks.forEach(function (value) {
                    var split = value.split(',')
                        breakStartTimes.push(split[1])
						breakEndTimes.push(split[2])

                })

                for (var i = 0; i < breakStartTimes.length; i++) {
                    breakStartTimes[i] = breakStartTimes[i] / (60 / bpm) / 1000
                    breakEndTimes[i] = breakEndTimes[i] / (60 / bpm) / 1000
                        if (breakStartTimes.length == 1) {
                            moop.write(`{"_time": ${breakStartTimes[0]}, "_name": "Break ${i+1}" }]}`)
                            moop.write(`{"_time": ${breakEndTimes[0]}, "_name": "End of Break ${i+1}" }]}`)
                        } else {
                            moop.write(`{"_time": ${breakStartTimes[i]}, "_name": "Break ${i+1}" },`)
                            moop.write(`{"_time": ${breakEndTimes[i]}, "_name": "End of Break ${i+1}" },`)
                        }
                        /*{
                        "_time": 0.9151999950408936,
                        "_name": "test"
                        }
                        if(i = breakStartTimes.length - 1){
                        console.log(breakStartTimes[i - 1 ])
                        moop.write(`{"_time": ${breakStartTimes[i - 1]}, "_name": "Break ${i+1}" }]}`)
                        return
                        }else{
                        moop.write(`{"_time": ${breakStartTimes[i - 1]}, "_name": "Break ${i+1}" },`)
                        }*/

                }
            } else {
                moop.write(`"_bookmarks": []}`)
                console.log('Done with ' + file.replace('osu', ''))
                return
            }

        }

    });
});
