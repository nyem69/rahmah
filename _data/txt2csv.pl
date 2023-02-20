

use File::Slurp;


my @rows;

my @files = read_dir('.');
for my $f(@files)	{
	if ($f =~ /01\.txt$/i)	{
		parse("./$f");
	}
}


open (OUT, ">", "menurahmah-01.csv") or die $!;
print OUT join(",",(qw( url nama alamat daerah jenis mula hingga))) . "\n";
for my $l(@rows){
	print OUT '"' . $l->{url} . '"';
	for my $c((qw( nama alamat daerah jenis mula hingga)))	{
		print OUT ',"' . $l->{$c} . '"';
	}
	print OUT "\n";
}
close (OUT);


sub parse	{
	my @lines = read_file(shift);
	for my $l(0..$#lines)	{
		$lines[$l]=~s/\r\n//;
		$lines[$l]=~s/\n//;
		$lines[$l]=~s/\s+$//;
	}

	my $r=0;
	for my $l(@lines)	{
		if ($l =~ /^https/)	{
			push @rows, {
				url=>$l,
				nama=>$lines[$r+1],
				alamat=>$lines[$r+2],
				daerah=>$lines[$r+3],
				jenis=>$lines[$r+4],
				mula=>$lines[$r+5],
				hingga=>$lines[$r+6],
			};
		}
		$r++;
	}

}